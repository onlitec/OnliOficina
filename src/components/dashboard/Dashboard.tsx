import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Car, 
  Wrench, 
  Calendar,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const stats = [
    {
      title: "Total de Clientes",
      value: "152",
      change: "+12%",
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Veículos Cadastrados",
      value: "298",
      change: "+8%",
      icon: Car,
      color: "text-accent"
    },
    {
      title: "Serviços Ativos",
      value: "23",
      change: "+15%",
      icon: Wrench,
      color: "text-success"
    },
    {
      title: "Receita Mensal",
      value: "R$ 45.230",
      change: "+22%",
      icon: DollarSign,
      color: "text-warning"
    }
  ];

  const recentServices = [
    {
      id: 1,
      cliente: "João Silva",
      veiculo: "Honda Civic 2020",
      servico: "Troca de óleo",
      status: "Concluído",
      data: "2024-01-15"
    },
    {
      id: 2,
      cliente: "Maria Santos",
      veiculo: "Toyota Corolla 2019",
      servico: "Revisão geral",
      status: "Em andamento",
      data: "2024-01-14"
    },
    {
      id: 3,
      cliente: "Pedro Costa",
      veiculo: "Ford Ka 2021",
      servico: "Alinhamento",
      status: "Aguardando",
      data: "2024-01-13"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'text-success bg-success/10';
      case 'Em andamento':
        return 'text-warning bg-warning/10';
      case 'Aguardando':
        return 'text-muted-foreground bg-muted';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de gestão da oficina
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-gradient-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
                <p className="text-xs text-success flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {stat.change} em relação ao mês anterior
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Serviços Recentes
            </CardTitle>
            <CardDescription>
              Últimos serviços realizados na oficina
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">
                      {service.cliente}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {service.veiculo} • {service.servico}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {service.data}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}
                  >
                    {service.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Ações Rápidas
            </CardTitle>
            <CardDescription>
              Acesso rápido às principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-border bg-gradient-primary/5 hover:bg-gradient-primary/10 transition-colors cursor-pointer">
                <Users className="w-8 h-8 text-primary mb-2" />
                <p className="font-medium text-foreground">Novo Cliente</p>
                <p className="text-sm text-muted-foreground">Cadastrar cliente</p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-gradient-accent/5 hover:bg-gradient-accent/10 transition-colors cursor-pointer">
                <Car className="w-8 h-8 text-accent mb-2" />
                <p className="font-medium text-foreground">Novo Veículo</p>
                <p className="text-sm text-muted-foreground">Adicionar veículo</p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-gradient-primary/5 hover:bg-gradient-primary/10 transition-colors cursor-pointer">
                <Wrench className="w-8 h-8 text-success mb-2" />
                <p className="font-medium text-foreground">Novo Serviço</p>
                <p className="text-sm text-muted-foreground">Registrar serviço</p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-gradient-accent/5 hover:bg-gradient-accent/10 transition-colors cursor-pointer">
                <Calendar className="w-8 h-8 text-warning mb-2" />
                <p className="font-medium text-foreground">Agenda</p>
                <p className="text-sm text-muted-foreground">Ver agendamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};