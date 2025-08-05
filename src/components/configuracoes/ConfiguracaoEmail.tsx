import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Mail, Save, TestTube } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type ConfiguracaoEmail = Tables<'configuracao_email'>;

const configuracaoEmailSchema = z.object({
  servidor_smtp: z.string().min(1, "Servidor SMTP é obrigatório"),
  porta: z.number().min(1, "Porta SMTP é obrigatória"),
  usuario: z.string().min(1, "Usuário SMTP é obrigatório"),
  senha: z.string().min(1, "Senha SMTP é obrigatória"),
  email_remetente: z.string().email("Email inválido"),
  nome_remetente: z.string().min(1, "Nome do remetente é obrigatório"),
  usar_ssl: z.boolean(),
  ativo: z.boolean(),
});

type ConfiguracaoEmailForm = z.infer<typeof configuracaoEmailSchema>;

export function ConfiguracaoEmail() {
  const [loading, setLoading] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [configuracao, setConfiguracao] = useState<ConfiguracaoEmail | null>(null);
  const [user, setUser] = useState<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ConfiguracaoEmailForm>({
    resolver: zodResolver(configuracaoEmailSchema),
    defaultValues: {
      servidor_smtp: "",
      porta: 587,
      usuario: "",
      senha: "",
      email_remetente: "",
      nome_remetente: "",
      usar_ssl: false,
      ativo: true,
    },
  });

  const usarSsl = watch('usar_ssl');
  const ativo = watch('ativo');

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
        .from('configuracao_email')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfiguracao(data);
        reset({
          servidor_smtp: data.servidor_smtp || "",
          porta: data.porta || 587,
          usuario: data.usuario || "",
          senha: data.senha || "",
          email_remetente: data.email_remetente || "",
          nome_remetente: data.nome_remetente || "",
          usar_ssl: data.usar_ssl || false,
          ativo: data.ativo || true,
        });
      }
    } catch (error: any) {
      console.error('Erro ao buscar configuração de email:', error);
      toast.error('Erro ao carregar configuração de email');
    }
  };

  const onSubmit = async (data: ConfiguracaoEmailForm) => {
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
          .from('configuracao_email')
          .update(configData)
          .eq('id', configuracao.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('configuracao_email')
          .insert([configData]);

        if (error) throw error;
      }

      toast.success('Configuração de email salva com sucesso!');
      fetchConfiguracao();
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração de email');
    } finally {
      setLoading(false);
    }
  };

  const testEmailConnection = async () => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    setTestingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { action: 'test' }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Erro ao testar conexão');
      }
    } catch (error: any) {
      console.error('Erro ao testar email:', error);
      toast.error('Erro ao testar conexão de email');
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Mail className="w-6 h-6 text-primary" />
          Configuração de Email
        </h2>
        <p className="text-muted-foreground">
          Configure as definições de email para envio de orçamentos e ordens de serviço
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações SMTP</CardTitle>
          <CardDescription>
            Configure o servidor SMTP para envio de emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="servidor_smtp">Servidor SMTP *</Label>
                <Input
                  id="servidor_smtp"
                  placeholder="smtp.gmail.com"
                  {...register('servidor_smtp')}
                />
                {errors.servidor_smtp && (
                  <p className="text-sm text-red-500">{errors.servidor_smtp.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="porta">Porta SMTP *</Label>
                <Input
                  id="porta"
                  type="number"
                  placeholder="587"
                  {...register('porta', { valueAsNumber: true })}
                />
                {errors.porta && (
                  <p className="text-sm text-red-500">{errors.porta.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usuario">Usuário SMTP *</Label>
                <Input
                  id="usuario"
                  type="email"
                  placeholder="seu-email@gmail.com"
                  {...register('usuario')}
                />
                {errors.usuario && (
                  <p className="text-sm text-red-500">{errors.usuario.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha SMTP *</Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="••••••••"
                  {...register('senha')}
                />
                {errors.senha && (
                  <p className="text-sm text-red-500">{errors.senha.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email_remetente">Email Remetente *</Label>
                <Input
                  id="email_remetente"
                  type="email"
                  placeholder="oficina@empresa.com"
                  {...register('email_remetente')}
                />
                {errors.email_remetente && (
                  <p className="text-sm text-red-500">{errors.email_remetente.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome_remetente">Nome do Remetente *</Label>
                <Input
                  id="nome_remetente"
                  placeholder="Oficina Mecânica"
                  {...register('nome_remetente')}
                />
                {errors.nome_remetente && (
                  <p className="text-sm text-red-500">{errors.nome_remetente.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="usar_ssl"
                  checked={usarSsl}
                  onCheckedChange={(checked) => setValue('usar_ssl', checked)}
                />
                <Label htmlFor="usar_ssl">Usar SSL</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={ativo}
                  onCheckedChange={(checked) => setValue('ativo', checked)}
                />
                <Label htmlFor="ativo">Configuração Ativa</Label>
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={testEmailConnection}
                disabled={testingEmail}
              >
                <TestTube className="h-4 w-4 mr-2" />
                {testingEmail ? "Testando..." : "Testar Conexão"}
              </Button>

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