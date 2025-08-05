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
  site: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
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
      site: "",
      endereco: "",
      cidade: "",
      estado: "",
      cep: "",
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
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("configuracao_empresa")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Erro ao buscar configuração:", error);
        return;
      }

      if (data) {
        setConfiguracao(data);
        reset({
          nome_empresa: data.nome_empresa || "",
          cnpj: data.cnpj || "",
          telefone: data.telefone || "",
          email: data.email || "",
          site: data.site || "",
          endereco: data.endereco || "",
          cidade: data.cidade || "",
          estado: data.estado || "",
          cep: data.cep || "",
          logo_url: data.logo_url || "",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar configuração:", error);
    }
  };

  const onSubmit = async (data: ConfiguracaoEmpresaForm) => {
    if (!user) return;

    setLoading(true);
    try {
      const configData = {
        nome_empresa: data.nome_empresa,
        cnpj: data.cnpj || null,
        telefone: data.telefone || null,
        email: data.email || null,
        site: data.site || null,
        endereco: data.endereco || null,
        cidade: data.cidade || null,
        estado: data.estado || null,
        cep: data.cep || null,
        logo_url: data.logo_url || null,
        user_id: user.id,
      };

      if (configuracao) {
        const { error } = await supabase
          .from("configuracao_empresa")
          .update(configData)
          .eq("id", configuracao.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("configuracao_empresa")
          .insert([configData]);

        if (error) throw error;
      }

      toast.success("Configuração salva com sucesso!");
      fetchConfiguracao();
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      toast.error("Erro ao salvar configuração");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Configuração da Empresa
          </CardTitle>
          <CardDescription>
            Configure as informações da sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome_empresa">Nome da Empresa *</Label>
                <Input
                  id="nome_empresa"
                  {...register('nome_empresa')}
                  placeholder="Nome da empresa"
                />
                {errors.nome_empresa && (
                  <p className="text-sm text-red-500">{errors.nome_empresa.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  {...register('cnpj')}
                  placeholder="00.000.000/0000-00"
                />
                {errors.cnpj && (
                  <p className="text-sm text-red-500">{errors.cnpj.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  {...register('telefone')}
                  placeholder="(00) 00000-0000"
                />
                {errors.telefone && (
                  <p className="text-sm text-red-500">{errors.telefone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="contato@empresa.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="site">Site</Label>
                <Input
                  id="site"
                  {...register('site')}
                  placeholder="https://www.empresa.com"
                />
                {errors.site && (
                  <p className="text-sm text-red-500">{errors.site.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  {...register('cep')}
                  placeholder="00000-000"
                />
                {errors.cep && (
                  <p className="text-sm text-red-500">{errors.cep.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                {...register('endereco')}
                placeholder="Rua, número, bairro"
              />
              {errors.endereco && (
                <p className="text-sm text-red-500">{errors.endereco.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  {...register('cidade')}
                  placeholder="Nome da cidade"
                />
                {errors.cidade && (
                  <p className="text-sm text-red-500">{errors.cidade.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  {...register('estado')}
                  placeholder="UF"
                  maxLength={2}
                />
                {errors.estado && (
                  <p className="text-sm text-red-500">{errors.estado.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_url">URL do Logo</Label>
              <Input
                id="logo_url"
                {...register('logo_url')}
                placeholder="https://exemplo.com/logo.png"
              />
              {errors.logo_url && (
                <p className="text-sm text-red-500">{errors.logo_url.message}</p>
              )}
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