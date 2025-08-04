import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Car, 
  Users, 
  Settings, 
  LogOut, 
  Menu,
  Wrench,
  Download,
  LayoutDashboard,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  onDownloadApp: () => void;
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeSection,
  onSectionChange,
  onLogout,
  onDownloadApp,
  className
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'veiculos', label: 'Veículos', icon: Car },
    { id: 'ordens', label: 'Ordens de Serviço', icon: Wrench },
    { id: 'servicos', label: 'Tipos de Serviços', icon: FileText },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <nav className={cn(
      "bg-card border-r border-border p-4 h-screen w-64 flex flex-col",
      className
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 p-2">
        <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
          <Wrench className="w-6 h-6 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground">OnliOficina</h1>
      </div>

      {/* Menu Items */}
      <div className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-12",
                activeSection === item.id && "bg-primary hover:bg-primary-hover"
              )}
              onClick={() => onSectionChange(item.id)}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Button>
          );
        })}
      </div>

      {/* Download App Button */}
      <div className="space-y-2 mt-6">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-12 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
          onClick={onDownloadApp}
        >
          <Download className="w-5 h-5" />
          Baixar App
        </Button>

        {/* Logout Button */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onLogout}
        >
          <LogOut className="w-5 h-5" />
          Sair
        </Button>
      </div>
    </nav>
  );
};