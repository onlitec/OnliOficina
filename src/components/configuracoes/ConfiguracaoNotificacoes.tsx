import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Bell, Save } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type ConfiguracaoNotificacoes = Tables<'configuracao_notificacoes'>;

const configuracaoNotificacoesSchema = z.object({
  email_notificacoes: z.string().email("Email inválido").optional().or(z.literal("")),
  notificar_estoque_baixo: z.boolean(),
  notificar_manutencao_ferramentas: z.boolean(),
  notificar_os_vencidas: z.boolean(),
  notificar_vencimento_contas: z.boolean(),
  dias_antecedencia_vencimento: z.number().min(1, "Deve ser pelo menos 1 dia").max(365, "Máximo 365 dias"),
});

type ConfiguracaoNotificacoesForm = z.infer<typeof configuracaoNotificacoesSchema>;

export function ConfiguracaoNotificacoes() {
  const [loading, setLoading] = useState(false);
  const [configuracao, setConfiguracao] = useState<ConfiguracaoNotificacoes | null>(null);
  const [user, setUser] = useState<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ConfiguracaoNotificacoesForm>({
    resolver: zodResolver(configuracaoNotificacoesSchema),
    defaultValues: {
      email_notificacoes: "",
      notificar_estoque_baixo: true,
      notificar_manutencao_ferramentas: true,
      notificar_os_vencidas: true,
      notificar_vencimento_contas: true,
      dias_antecedencia_vencimento: 7,
    },
  });

  const notificarEstoqueBaixo = watch('notificar_estoque_baixo');
  const notificarManutencaoFerramentas = watch('notificar_manutencao_ferramentas');
  const notificarOsVencidas = watch('notificar_os_vencidas');
  const notificarVencimentoContas = watch('notificar_vencimento_contas');

  useEffect(() => {
    // Get current user and fetch configuration
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchConfiguracao();
      }
    };
    
    getCurrentUser();
  }, []);

  const fetchConfiguracao = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracao_notificacoes')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfiguracao(data);
        reset({
          email_notificacoes: data.email_notificacoes || "",
          notificar_estoque_baixo: data.notificar_estoque_baixo ?? true,
          notificar_manutencao_ferramentas: data.notificar_manutencao_ferramentas ?? true,
          notificar_os_vencidas: data.notificar_os_vencidas ?? true,
          notificar_vencimento_contas: data.notificar_vencimento_contas ?? true,
          dias_antecedencia_vencimento: data.dias_antecedencia_vencimento || 7,
        });
      }
    } catch (error: any) {
      console.error('Erro ao buscar configuração de notificações:', error);
      toast.error('Erro ao carregar configuração de notificações');
    }
  };

  const onSubmit = async (data: ConfiguracaoNotificacoesForm) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    setLoading(true);
    try {
      const configData = {
        ...data,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (configuracao) {
        const { error } = await supabase
          .from('configuracao_notificacoes')
          .update(configData)
          .eq('id', configuracao.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('configuracao_notificacoes')
          .insert([configData]);

        if (error) throw error;
      }

      toast.success('Configuração de notificações salva com sucesso!');
      fetchConfiguracao();
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração de notificações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" />
          Configuração de Notificações
        </h2>
        <p className="text-muted-foreground">
          Configure as notificações automáticas do sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações de Notificação</CardTitle>
          <CardDescription>
            Defina quando e como receber notificações importantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email_notificacoes">Email para Notificações</Label>
              <Input
                id="email_notificacoes"
                type="email"
                placeholder="notificacoes@empresa.com"
                {...register('email_notificacoes')}
              />
              {errors.email_notificacoes && (
                <p className="text-sm text-red-500">{errors.email_notificacoes.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Email onde serão enviadas as notificações automáticas
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tipos de Notificação</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="notificar_estoque_baixo" className="text-base font-medium">
                      Estoque Baixo
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações quando o estoque de peças estiver baixo
                    </p>
                  </div>
                  <Switch
                    id="notificar_estoque_baixo"
                    checked={notificarEstoqueBaixo}
                    onCheckedChange={(checked) => setValue('notificar_estoque_baixo', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="notificar_manutencao_ferramentas" className="text-base font-medium">
                      Manutenção de Ferramentas
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações sobre manutenções de ferramentas vencidas
                    </p>
                  </div>
                  <Switch
                    id="notificar_manutencao_ferramentas"
                    checked={notificarManutencaoFerramentas}
                    onCheckedChange={(checked) => setValue('notificar_manutencao_ferramentas', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="notificar_os_vencidas" className="text-base font-medium">
                      Ordens de Serviço Vencidas
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações sobre ordens de serviço com prazo vencido
                    </p>
                  </div>
                  <Switch
                    id="notificar_os_vencidas"
                    checked={notificarOsVencidas}
                    onCheckedChange={(checked) => setValue('notificar_os_vencidas', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="notificar_vencimento_contas" className="text-base font-medium">
                      Vencimento de Contas
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações sobre contas a pagar e receber próximas do vencimento
                    </p>
                  </div>
                  <Switch
                    id="notificar_vencimento_contas"
                    checked={notificarVencimentoContas}
                    onCheckedChange={(checked) => setValue('notificar_vencimento_contas', checked)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dias_antecedencia_vencimento">Dias de Antecedência para Vencimentos</Label>
              <Input
                id="dias_antecedencia_vencimento"
                type="number"
                min="1"
                max="365"
                placeholder="7"
                {...register('dias_antecedencia_vencimento', { valueAsNumber: true })}
              />
              {errors.dias_antecedencia_vencimento && (
                <p className="text-sm text-red-500">{errors.dias_antecedencia_vencimento.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Quantos dias antes do vencimento você deseja ser notificado
              </p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Salvando..." : "Salvar Configuração"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}