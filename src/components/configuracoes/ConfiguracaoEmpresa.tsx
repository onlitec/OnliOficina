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
import { toast } from 'sonner';
import { Building2, Save } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type ConfiguracaoEmpresa = Tables<'configuracao_empresa'>;

const configuracaoEmpresaSchema = z.object({
  nome_empresa: z.string().min(1, "Nome da empresa é obrigatório"),
  cnpj: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
  site: z.string().optional(),
  logo_url: z.string().optional(),
});

type ConfiguracaoEmpresaForm = z.infer<typeof configuracaoEmpresaSchema>;

export function ConfiguracaoEmpresa() {
  const [loading, setLoading] = useState(false);
  const [configuracao, setConfiguracao] = useState<ConfiguracaoEmpresa | null>(null);
  const [user, setUser] = useState<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConfiguracaoEmpresaForm>({
    resolver: zodResolver(configuracaoEmpresaSchema),
    defaultValues: {
      nome_empresa: "",
      cnpj: "",
      telefone: "",
      email: "",
      endereco: "",
      cidade: "",
      estado: "",
      cep: "",
      site: "",
      logo_url: "",
    },
  });

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
        .from('configuracao_empresa')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfiguracao(data);
        reset({
          nome_empresa: data.nome_empresa || "",
          cnpj: data.cnpj || "",
          telefone: data.telefone || "",
          email: data.email || "",
          endereco: data.endereco || "",
          cidade: data.cidade || "",
          estado: data.estado || "",
          cep: data.cep || "",
          site: data.site || "",
          logo_url: data.logo_url || "",
        });
      }
    } catch (error: any) {
      console.error('Erro ao buscar configuração da empresa:', error);
      toast.error('Erro ao carregar configuração da empresa');
    }
  };

  const onSubmit = async (data: ConfiguracaoEmpresaForm) => {
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
          .from('configuracao_empresa')
          .update(configData)
          .eq('id', configuracao.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('configuracao_empresa')
          .insert([configData]);

        if (error) throw error;
      }

      toast.success('Configuração da empresa salva com sucesso!');
      fetchConfiguracao();
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração da empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary" />
          Configuração da Empresa
        </h2>
        <p className="text-muted-foreground">
          Configure as informações da sua empresa
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Empresa</CardTitle>
          <CardDescription>
            Mantenha os dados da sua empresa sempre atualizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome_empresa">Nome da Empresa *</Label>
                <Input
                  id="nome_empresa"
                  placeholder="Oficina Mecânica Ltda"
                  {...register('nome_empresa')}
                />
                {errors.nome_empresa && (
                  <p className="text-sm text-red-500">{errors.nome_empresa.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  {...register('cnpj')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  placeholder="(11) 99999-9999"
                  {...register('telefone')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contato@oficina.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                placeholder="Rua das Flores, 123"
                {...register('endereco')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  placeholder="São Paulo"
                  {...register('cidade')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  placeholder="SP"
                  {...register('estado')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  placeholder="00000-000"
                  {...register('cep')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="site">Site</Label>
                <Input
                  id="site"
                  placeholder="https://www.oficina.com"
                  {...register('site')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo_url">URL do Logo</Label>
                <Input
                  id="logo_url"
                  placeholder="https://exemplo.com/logo.png"
                  {...register('logo_url')}
                />
              </div>
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