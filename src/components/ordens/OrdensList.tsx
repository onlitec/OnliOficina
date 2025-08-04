import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Eye, Edit, Wrench, Calendar, Car, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface OrdemServico {
  id: string;
  numero_os: string;
  data_entrada: string;
  data_saida?: string;
  status: string;
  problema_relatado?: string;
  diagnostico?: string;
  observacoes?: string;
  km_entrada?: number;
  valor_total: number;
  valor_final: number;
  desconto: number;
  cliente_id: string;
  veiculo_id: string;
  cliente?: {
    nome: string;
    telefone?: string;
  };
  veiculo?: {
    marca: string;
    modelo: string;
    placa?: string;
    ano?: number;
  };
}

export const OrdensList: React.FC = () => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrdem, setEditingOrdem] = useState<OrdemServico | null>(null);
  const [formData, setFormData] = useState({
    cliente_id: '',
    veiculo_id: '',
    problema_relatado: '',
    diagnostico: '',
    observacoes: '',
    km_entrada: '',
    status: 'aguardando',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchOrdens();
    fetchClientes();
    fetchVeiculos();
  }, []);

  const fetchOrdens = async () => {
    try {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select(`
          *,
          cliente:clientes(nome, telefone),
          veiculo:veiculos(marca, modelo, placa, ano)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrdens(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar ordens",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome')
        .order('nome');

      if (error) throw error;
      setClientes(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const fetchVeiculos = async () => {
    try {
      const { data, error } = await supabase
        .from('veiculos')
        .select('id, marca, modelo, placa, cliente_id')
        .order('marca');

      if (error) throw error;
      setVeiculos(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar veículos:', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const ordemData: any = {
        cliente_id: formData.cliente_id,
        veiculo_id: formData.veiculo_id,
        problema_relatado: formData.problema_relatado,
        diagnostico: formData.diagnostico,
        observacoes: formData.observacoes,
        km_entrada: formData.km_entrada ? parseInt(formData.km_entrada) : null,
        status: formData.status,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      };

      if (editingOrdem) {
        const { error } = await supabase
          .from('ordens_servico')
          .update(ordemData)
          .eq('id', editingOrdem.id);

        if (error) throw error;

        toast({
          title: "Ordem atualizada!",
          description: "A ordem de serviço foi atualizada com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from('ordens_servico')
          .insert(ordemData);

        if (error) throw error;

        toast({
          title: "Ordem criada!",
          description: "A ordem de serviço foi criada com sucesso.",
        });
      }

      setIsDialogOpen(false);
      setEditingOrdem(null);
      setFormData({
        cliente_id: '',
        veiculo_id: '',
        problema_relatado: '',
        diagnostico: '',
        observacoes: '',
        km_entrada: '',
        status: 'aguardando',
      });
      fetchOrdens();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (ordem: OrdemServico) => {
    setEditingOrdem(ordem);
    setFormData({
      cliente_id: ordem.cliente_id,
      veiculo_id: ordem.veiculo_id,
      problema_relatado: ordem.problema_relatado || '',
      diagnostico: ordem.diagnostico || '',
      observacoes: ordem.observacoes || '',
      km_entrada: ordem.km_entrada?.toString() || '',
      status: ordem.status,
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingOrdem(null);
    setFormData({
      cliente_id: '',
      veiculo_id: '',
      problema_relatado: '',
      diagnostico: '',
      observacoes: '',
      km_entrada: '',
      status: 'aguardando',
    });
    setIsDialogOpen(true);
  };

  const filteredOrdens = ordens.filter(ordem =>
    ordem.numero_os?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ordem.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ordem.veiculo?.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ordem.veiculo?.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ordem.veiculo?.placa?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const veiculosDoCliente = veiculos.filter(veiculo => veiculo.cliente_id === formData.cliente_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Wrench className="w-8 h-8 text-primary" />
            Ordens de Serviço
          </h1>
          <p className="text-muted-foreground">
            Gerencie as ordens de serviço da oficina
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} className="bg-primary hover:bg-primary-hover">
              <Plus className="w-4 h-4 mr-2" />
              Nova Ordem
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingOrdem ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
              </DialogTitle>
              <DialogDescription>
                {editingOrdem 
                  ? 'Edite as informações da ordem de serviço'
                  : 'Preencha os dados para criar uma nova ordem de serviço'
                }
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente_id">Cliente *</Label>
                  <Select
                    value={formData.cliente_id}
                    onValueChange={(value) => {
                      setFormData({ ...formData, cliente_id: value, veiculo_id: '' });
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map(cliente => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="veiculo_id">Veículo *</Label>
                  <Select
                    value={formData.veiculo_id}
                    onValueChange={(value) => setFormData({ ...formData, veiculo_id: value })}
                    required
                    disabled={!formData.cliente_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um veículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {veiculosDoCliente.map(veiculo => (
                        <SelectItem key={veiculo.id} value={veiculo.id}>
                          {veiculo.marca} {veiculo.modelo} - {veiculo.placa}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="km_entrada">KM de Entrada</Label>
                  <Input
                    id="km_entrada"
                    type="number"
                    placeholder="Ex: 50000"
                    value={formData.km_entrada}
                    onChange={(e) => setFormData({ ...formData, km_entrada: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aguardando">Aguardando</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="finalizado">Finalizado</SelectItem>
                      <SelectItem value="entregue">Entregue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="problema_relatado">Problema Relatado</Label>
                <Textarea
                  id="problema_relatado"
                  placeholder="Descreva o problema relatado pelo cliente..."
                  value={formData.problema_relatado}
                  onChange={(e) => setFormData({ ...formData, problema_relatado: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnostico">Diagnóstico</Label>
                <Textarea
                  id="diagnostico"
                  placeholder="Diagnóstico técnico do problema..."
                  value={formData.diagnostico}
                  onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Observações adicionais..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Salvando...' : editingOrdem ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Ordens</CardTitle>
          <CardDescription>
            Encontre ordens por número, cliente ou veículo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número da OS, cliente, marca ou placa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Ordens de Serviço</CardTitle>
          <CardDescription>
            {filteredOrdens.length} ordem(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando ordens...</p>
            </div>
          ) : filteredOrdens.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhuma ordem encontrada
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Tente ajustar os termos de busca' : 'Comece criando sua primeira ordem de serviço'}
              </p>
              {!searchTerm && (
                <Button onClick={openNewDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Ordem
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número OS</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Data Entrada</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrdens.map((ordem) => (
                    <TableRow key={ordem.id}>
                      <TableCell className="font-mono font-medium">
                        {ordem.numero_os}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{ordem.cliente?.nome}</p>
                            {ordem.cliente?.telefone && (
                              <p className="text-sm text-muted-foreground">
                                {ordem.cliente.telefone}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {ordem.veiculo?.marca} {ordem.veiculo?.modelo}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {ordem.veiculo?.placa} - {ordem.veiculo?.ano}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {new Date(ordem.data_entrada).toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(ordem.status)}
                      </TableCell>
                      <TableCell className="font-medium">
                        R$ {ordem.valor_total?.toFixed(2) || '0,00'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(ordem)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};