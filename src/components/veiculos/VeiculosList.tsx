import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar, 
  Gauge,
  Fuel,
  User
} from 'lucide-react';

interface Veiculo {
  id: number;
  marca: string;
  modelo: string;
  ano: number;
  cor: string;
  placa: string;
  cliente: string;
  combustivel: string;
  quilometragem?: number;
  status: 'Ativo' | 'Manutenção' | 'Inativo';
  proximaRevisao?: string;
  foto?: string;
}

export const VeiculosList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Mock data - em um app real, isso viria de uma API
  const veiculos: Veiculo[] = [
    {
      id: 1,
      marca: "Honda",
      modelo: "Civic",
      ano: 2020,
      cor: "Prata",
      placa: "ABC-1234",
      cliente: "João Silva",
      combustivel: "Flex",
      quilometragem: 45000,
      status: "Ativo",
      proximaRevisao: "2024-03-15"
    },
    {
      id: 2,
      marca: "Toyota",
      modelo: "Corolla",
      ano: 2019,
      cor: "Branco",
      placa: "DEF-5678",
      cliente: "Maria Santos",
      combustivel: "Flex",
      quilometragem: 62000,
      status: "Manutenção",
      proximaRevisao: "2024-02-20"
    },
    {
      id: 3,
      marca: "Ford",
      modelo: "Ka",
      ano: 2021,
      cor: "Preto",
      placa: "GHI-9012",
      cliente: "Pedro Costa",
      combustivel: "Flex",
      quilometragem: 28000,
      status: "Ativo",
      proximaRevisao: "2024-04-10"
    }
  ];

  const filteredVeiculos = veiculos.filter(veiculo =>
    veiculo.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    veiculo.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    veiculo.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    veiculo.cliente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Ativo':
        return <Badge className="bg-success/10 text-success hover:bg-success/20">Ativo</Badge>;
      case 'Manutenção':
        return <Badge className="bg-warning/10 text-warning hover:bg-warning/20">Manutenção</Badge>;
      default:
        return <Badge variant="secondary">Inativo</Badge>;
    }
  };

  const getCombustivelIcon = (combustivel: string) => {
    return <Fuel className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Car className="w-8 h-8 text-primary" />
            Veículos
          </h1>
          <p className="text-muted-foreground">
            Gerencie todos os veículos cadastrados
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-primary hover:bg-primary-hover"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Veículo
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar veículos por marca, modelo, placa ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{veiculos.length}</p>
              </div>
              <Car className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold text-success">
                  {veiculos.filter(v => v.status === 'Ativo').length}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                <Car className="w-4 h-4 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Manutenção</p>
                <p className="text-2xl font-bold text-warning">
                  {veiculos.filter(v => v.status === 'Manutenção').length}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                <Car className="w-4 h-4 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revisões</p>
                <p className="text-2xl font-bold text-accent">3</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Veículos List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVeiculos.map((veiculo) => (
          <Card key={veiculo.id} className="bg-gradient-card hover:shadow-custom-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg text-foreground">
                    {veiculo.marca} {veiculo.modelo}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {veiculo.ano} • {veiculo.cor} • {veiculo.placa}
                  </CardDescription>
                </div>
                {getStatusBadge(veiculo.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{veiculo.cliente}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {getCombustivelIcon(veiculo.combustivel)}
                  <span className="text-foreground">{veiculo.combustivel}</span>
                </div>
                {veiculo.quilometragem && (
                  <div className="flex items-center gap-2 text-sm">
                    <Gauge className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">
                      {veiculo.quilometragem.toLocaleString('pt-BR')} km
                    </span>
                  </div>
                )}
                {veiculo.proximaRevisao && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">
                      Revisão: {new Date(veiculo.proximaRevisao).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit2 className="w-3 h-3 mr-1" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVeiculos.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum veículo encontrado
            </h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Tente ajustar os termos de busca.' : 'Comece adicionando o primeiro veículo.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};