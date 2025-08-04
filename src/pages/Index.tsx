import React, { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { Navigation } from '@/components/ui/navigation';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ClientesList } from '@/components/clientes/ClientesList';
import { VeiculosList } from '@/components/veiculos/VeiculosList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Download, Smartphone, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const { toast } = useToast();

  const handleLogin = async (username: string, password: string) => {
    // Simular autenticação
    if (username === 'AdminSuperUser' && password === 'admin123') {
      setIsAuthenticated(true);
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao AutoGest",
      });
    } else {
      throw new Error('Credenciais inválidas');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveSection('dashboard');
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado do sistema",
    });
  };

  const handleDownloadApp = () => {
    toast({
      title: "Download do App",
      description: "Funcionalidade de download será implementada em breve!",
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
      case 'configuracoes':
        return <ConfiguracoesPage />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-background">
      <Navigation
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={handleLogout}
        onDownloadApp={handleDownloadApp}
      />
      <main className="flex-1 overflow-auto p-6">
        {renderContent()}
      </main>
    </div>
  );
};

const ConfiguracoesPage: React.FC = () => {
  const { toast } = useToast();

  const handleDownloadApp = () => {
    toast({
      title: "Preparando download...",
      description: "O aplicativo mobile estará disponível em breve para Android e iOS",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-8 h-8 text-primary" />
          Configurações
        </h1>
        <p className="text-muted-foreground">
          Configure o sistema e baixe o aplicativo mobile
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* App Mobile Card */}
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-primary" />
              Aplicativo Mobile
            </CardTitle>
            <CardDescription>
              Baixe o app para gerenciar sua oficina em qualquer lugar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">AutoGest Mobile</h3>
                <p className="text-sm text-muted-foreground">
                  Acesso completo às funcionalidades da oficina
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <div className="w-2 h-2 rounded-full bg-success"></div>
                Gestão de clientes e veículos
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <div className="w-2 h-2 rounded-full bg-success"></div>
                Sincronização em tempo real
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <div className="w-2 h-2 rounded-full bg-success"></div>
                Funciona offline
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <div className="w-2 h-2 rounded-full bg-success"></div>
                Interface otimizada para mobile
              </div>
            </div>

            <Button 
              onClick={handleDownloadApp}
              className="w-full bg-gradient-primary hover:bg-primary-hover text-primary-foreground"
              size="lg"
            >
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
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="w-12 h-12 bg-gradient-accent rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">AutoGest Web</h3>
                <p className="text-sm text-muted-foreground">
                  Acesse pelo navegador em qualquer dispositivo
                </p>
              </div>
            </div>
            
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
              <input
                type="text"
                className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                defaultValue="AutoGest - Oficina Mecânica"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                CNPJ
              </label>
              <input
                type="text"
                className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                defaultValue="12.345.678/0001-90"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Endereço
              </label>
              <input
                type="text"
                className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                defaultValue="Rua das Oficinas, 123"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Telefone
              </label>
              <input
                type="text"
                className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                defaultValue="(11) 3456-7890"
              />
            </div>
          </div>
          <div className="mt-6">
            <Button className="bg-primary hover:bg-primary-hover">
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;