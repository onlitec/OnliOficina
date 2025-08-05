import React, { useState, useEffect } from 'react';
import { AuthPage } from './AuthPage';
import { Navigation } from '@/components/ui/navigation';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ClientesList } from '@/components/clientes/ClientesList';
import { VeiculosList } from '@/components/veiculos/VeiculosList';
import { OrdensList } from '@/components/ordens/OrdensList';
import { ServicosList } from '@/components/servicos/ServicosList';
import { GerenciamentoUsuarios } from '@/components/usuarios/GerenciamentoUsuarios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const {
    toast
  } = useToast();
  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);
  const handleLogin = async (email: string, password: string) => {
    console.log('Tentando login com:', {
      email
    });
    try {
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      console.log('Resultado do login:', {
        data,
        error
      });
      if (error) {
        console.error('Erro de autenticação:', error);
        throw error;
      }
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao AutoGest"
      });
    } catch (error: any) {
      console.error('Erro capturado no handleLogin:', error);
      throw error;
    }
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setActiveSection('dashboard');
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado do sistema"
    });
  };
  const handleDownloadApp = () => {
    toast({
      title: "Download do App",
      description: "Funcionalidade de download será implementada em breve!"
    });
  };
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'clientes':
        return <ClientesList />;
      case 'veiculos':
        return <VeiculosList />;
      case 'ordens':
        return <OrdensList />;
      case 'servicos':
        return <ServicosList />;
      case 'usuarios':
        return <GerenciamentoUsuarios />;
      case 'configuracoes':
        return <ConfiguracoesPage />;
      default:
        return <Dashboard />;
    }
  };
  if (!session || !user) {
    return <AuthPage onAuthSuccess={() => {}} />;
  }
  return <div className="flex h-screen bg-background">
      <Navigation activeSection={activeSection} onSectionChange={setActiveSection} onLogout={handleLogout} onDownloadApp={handleDownloadApp} />
      <main className="flex-1 overflow-auto p-6">
        {renderContent()}
      </main>
    </div>;
};
const ConfiguracoesPage: React.FC = () => {
<<<<<<< HEAD
  const {
    toast
  } = useToast();
  const handleDownloadApp = () => {
    toast({
      title: "Preparando download...",
      description: "O aplicativo mobile estará disponível em breve para Android e iOS"
    });
  };
  return <div className="space-y-6">
=======
  const { toast } = useToast();



  return (
    <div className="space-y-6">
>>>>>>> 0383991 (Remove opção de cadastro da página de login - agora o cadastro será feito via API ou página de configurações)
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-8 h-8 text-primary" />
          Configurações
        </h1>
        <p className="text-muted-foreground">
          Configure o sistema e baixe o aplicativo mobile
        </p>
      </div>


<<<<<<< HEAD
            <Button onClick={handleDownloadApp} className="w-full bg-gradient-primary hover:bg-primary-hover text-primary-foreground" size="lg">
              <Download className="w-4 h-4 mr-2" />
              Baixar Aplicativo
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              Disponível para Android e iOS
            </p>
          </CardContent>
        </Card>

        {/* Sistema Web Card */}
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-6 h-6 text-accent" />
              Plataforma Web
            </CardTitle>
            <CardDescription>
              Informações sobre a versão web do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                Interface responsiva
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                Atualizações automáticas
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                Backup em nuvem
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                Acesso multiplataforma
              </div>
            </div>

            <div className="bg-success/10 border border-success/20 rounded-lg p-3">
              <p className="text-sm text-success font-medium">
                ✓ Você está usando a versão web atual
              </p>
              <p className="text-xs text-success/80 mt-1">
                Sistema atualizado e funcionando perfeitamente
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
=======
>>>>>>> 0383991 (Remove opção de cadastro da página de login - agora o cadastro será feito via API ou página de configurações)

      {/* Configurações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Sistema</CardTitle>
          <CardDescription>
            Personalize as configurações da oficina
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Nome da Oficina
              </label>
              <input type="text" className="w-full p-2 border border-border rounded-md bg-background text-foreground" defaultValue="AutoGest - Oficina Mecânica" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                CNPJ
              </label>
              <input type="text" className="w-full p-2 border border-border rounded-md bg-background text-foreground" defaultValue="12.345.678/0001-90" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Endereço
              </label>
              <input type="text" className="w-full p-2 border border-border rounded-md bg-background text-foreground" defaultValue="Rua das Oficinas, 123" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Telefone
              </label>
              <input type="text" className="w-full p-2 border border-border rounded-md bg-background text-foreground" defaultValue="(11) 3456-7890" />
            </div>
          </div>
          <div className="mt-6">
            <Button className="bg-primary hover:bg-primary-hover">
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default Index;