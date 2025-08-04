import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Car, 
  Wrench, 
  Settings, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Clock,
  Activity,
  BarChart3,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  total_clientes: number;
  total_veiculos: number;
  total_ordens: number;
  total_servicos: number;
  ordens_hoje: number;
  faturamento_mes: number;
  ordens_por_status: {
    aguardando: number;
    em_andamento: number;
    finalizado: number;
    entregue: number;
  };
  recent_orders: any[];
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    total_clientes: 0,
    total_veiculos: 0,
    total_ordens: 0,
    total_servicos: 0,
    ordens_hoje: 0,
    faturamento_mes: 0,
    ordens_por_status: {
      aguardando: 0,
      em_andamento: 0,
      finalizado: 0,
      entregue: 0,
    },
    recent_orders: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    
    // Atualizar estatísticas a cada 30 segundos
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Buscar todas as estatísticas em paralelo
      const [
        clientesResult,
        veiculosResult,
        ordensResult,
        servicosResult,
        ordensHojeResult,
        recentOrdersResult
      ] = await Promise.all([
        supabase.from('clientes').select('id', { count: 'exact' }),
        supabase.from('veiculos').select('id', { count: 'exact' }),
        supabase.from('ordens_servico').select('id, status, valor_final', { count: 'exact' }),
        supabase.from('tipos_servicos').select('id', { count: 'exact' }),
        supabase.from('ordens_servico')
          .select('id', { count: 'exact' })
          .gte('created_at', new Date().toISOString().split('T')[0]),
        supabase.from('ordens_servico')
          .select(`
            id, numero_os, status, valor_final, created_at,
            cliente:clientes(nome),
            veiculo:veiculos(marca, modelo)
          `)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      const ordensData = ordensResult.data || [];
      
      // Calcular estatísticas por status
      const statusStats = {
        aguardando: ordensData.filter((o: any) => o.status === 'aguardando').length,
        em_andamento: ordensData.filter((o: any) => o.status === 'em_andamento').length,
        finalizado: ordensData.filter((o: any) => o.status === 'finalizado').length,
        entregue: ordensData.filter((o: any) => o.status === 'entregue').length,
      };

      // Calcular faturamento do mês
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const { data: faturamentoData } = await supabase
        .from('ordens_servico')
        .select('valor_final')
        .eq('status', 'entregue')
        .gte('updated_at', inicioMes.toISOString());

      const faturamentoMes = faturamentoData?.reduce((sum, ordem) => 
        sum + (ordem.valor_final || 0), 0) || 0;

      setStats({
        total_clientes: clientesResult.count || 0,
        total_veiculos: veiculosResult.count || 0,
        total_ordens: ordensResult.count || 0,
        total_servicos: servicosResult.count || 0,
        ordens_hoje: ordensHojeResult.count || 0,
        faturamento_mes: faturamentoMes,
        ordens_por_status: statusStats,
        recent_orders: recentOrdersResult.data || []
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      aguardando: { label: 'Aguardando', variant: 'secondary' as const },
      em_andamento: { label: 'Em Andamento', variant: 'default' as const },
      finalizado: { label: 'Finalizado', variant: 'outline' as const },
      entregue: { label: 'Entregue', variant: 'default' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge variant={config?.variant || 'secondary'}>
        {config?.label || status}
      </Badge>
    );
  };

  const totalOrdens = Object.values(stats.ordens_por_status).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-primary" />
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Visão geral da sua oficina mecânica
        </p>
      </div>

      {/* Cards de estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_clientes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Clientes cadastrados no sistema
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Veículos Cadastrados</CardTitle>
            <Car className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_veiculos.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Veículos no banco de dados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ordens de Serviço</CardTitle>
            <Wrench className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_ordens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.ordens_hoje} hoje
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.faturamento_mes.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Receita do mês atual
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status das ordens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Status das Ordens de Serviço
            </CardTitle>
            <CardDescription>
              Distribuição atual das ordens por status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Aguardando</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {stats.ordens_por_status.aguardando}
                  </span>
                  <Badge variant="secondary">
                    {totalOrdens > 0 ? Math.round((stats.ordens_por_status.aguardando / totalOrdens) * 100) : 0}%
                  </Badge>
                </div>
              </div>
              <Progress 
                value={totalOrdens > 0 ? (stats.ordens_por_status.aguardando / totalOrdens) * 100 : 0} 
                className="h-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Em Andamento</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {stats.ordens_por_status.em_andamento}
                  </span>
                  <Badge variant="default">
                    {totalOrdens > 0 ? Math.round((stats.ordens_por_status.em_andamento / totalOrdens) * 100) : 0}%
                  </Badge>
                </div>
              </div>
              <Progress 
                value={totalOrdens > 0 ? (stats.ordens_por_status.em_andamento / totalOrdens) * 100 : 0} 
                className="h-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Finalizado</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {stats.ordens_por_status.finalizado}
                  </span>
                  <Badge variant="outline">
                    {totalOrdens > 0 ? Math.round((stats.ordens_por_status.finalizado / totalOrdens) * 100) : 0}%
                  </Badge>
                </div>
              </div>
              <Progress 
                value={totalOrdens > 0 ? (stats.ordens_por_status.finalizado / totalOrdens) * 100 : 0} 
                className="h-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Entregue</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {stats.ordens_por_status.entregue}
                  </span>
                  <Badge variant="default">
                    {totalOrdens > 0 ? Math.round((stats.ordens_por_status.entregue / totalOrdens) * 100) : 0}%
                  </Badge>
                </div>
              </div>
              <Progress 
                value={totalOrdens > 0 ? (stats.ordens_por_status.entregue / totalOrdens) * 100 : 0} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Ordens recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Ordens Recentes
            </CardTitle>
            <CardDescription>
              Últimas ordens de serviço criadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Carregando...</p>
              </div>
            ) : stats.recent_orders.length === 0 ? (
              <div className="text-center py-8">
                <Wrench className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma ordem encontrada
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recent_orders.map((ordem) => (
                  <div 
                    key={ordem.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        OS #{ordem.numero_os}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ordem.cliente?.nome} - {ordem.veiculo?.marca} {ordem.veiculo?.modelo}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ordem.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(ordem.status)}
                      <p className="text-sm font-medium mt-1">
                        R$ {ordem.valor_final?.toFixed(2) || '0,00'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cards de ação rápida */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-lg">Resumo do Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm opacity-90">
                Ordens criadas hoje: <strong>{stats.ordens_hoje}</strong>
              </p>
              <p className="text-sm opacity-90">
                Em andamento: <strong>{stats.ordens_por_status.em_andamento}</strong>
              </p>
              <p className="text-sm opacity-90">
                Aguardando: <strong>{stats.ordens_por_status.aguardando}</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-accent text-accent-foreground">
          <CardHeader>
            <CardTitle className="text-lg">Tipos de Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold">{stats.total_servicos}</p>
              <p className="text-sm opacity-90">
                Serviços cadastrados no sistema
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Taxa de conclusão mensal
              </p>
              <p className="text-2xl font-bold text-primary">
                {totalOrdens > 0 ? Math.round(((stats.ordens_por_status.entregue + stats.ordens_por_status.finalizado) / totalOrdens) * 100) : 0}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};