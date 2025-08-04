import React, { useState, useEffect } from 'react';
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
  User,
  Hash
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { VeiculoForm } from './VeiculoForm';

interface Veiculo {
  id: string;
  codigo?: string;
  marca: string;
  modelo: string;
  ano?: number;
  cor?: string;
  placa?: string;
  combustivel?: string;
  km_atual?: number;
  chassi?: string;
  observacoes?: string;
  cliente_id: string;
  created_at: string;
  clientes?: {
    nome: string;
    codigo?: string;
  };
}

export const VeiculosList: React.FC = () => {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVeiculo, setEditingVeiculo] = useState<Veiculo | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchVeiculos();
  }, []);

  const fetchVeiculos = async () => {
    try {
      const { data, error } = await supabase
        .from('veiculos')
        .select(`
          *,
          clientes (
            nome,
            codigo
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVeiculos(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar veículos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (veiculo: Veiculo) => {
    setEditingVeiculo(veiculo);
    setShowForm(true);
  };

  const handleDelete = async (veiculo: Veiculo) => {
    if (!confirm(`Tem certeza que deseja excluir o veículo "${veiculo.marca} ${veiculo.modelo}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('veiculos')
        .delete()
        .eq('id', veiculo.id);

      if (error) throw error;

      toast({
        title: "Veículo excluído!",
        description: "O veículo foi excluído com sucesso.",
      });

      fetchVeiculos();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    fetchVeiculos();
    setEditingVeiculo(null);
  };

  const handleNewVeiculo = () => {
    setEditingVeiculo(null);
    setShowForm(true);
  };

  const filteredVeiculos = veiculos.filter(veiculo =>
    veiculo.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    veiculo.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    veiculo.placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    veiculo.clientes?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    veiculo.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = () => {
    return <Badge className="bg-success/10 text-success hover:bg-success/20">Ativo</Badge>;
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
          onClick={handleNewVeiculo}
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <p className="text-sm text-muted-foreground">Hoje</p>
                <p className="text-2xl font-bold text-success">
                  {veiculos.filter(v => 
                    new Date(v.created_at).toDateString() === new Date().toDateString()
                  ).length}
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
                <p className="text-sm text-muted-foreground">Este mês</p>
                <p className="text-2xl font-bold text-accent">
                  {veiculos.filter(v => {
                    const vehicleDate = new Date(v.created_at);
                    const now = new Date();
                    return vehicleDate.getMonth() === now.getMonth() && 
                           vehicleDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando veículos...</p>
        </div>
      ) : (
        <>
          {/* Veículos List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVeiculos.map((veiculo) => (
              <Card key={veiculo.id} className="bg-gradient-card hover:shadow-custom-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg text-foreground">
                          {veiculo.marca} {veiculo.modelo}
                        </CardTitle>
                        {veiculo.codigo && (
                          <Badge variant="outline" className="text-xs">
                            <Hash className="w-3 h-3 mr-1" />
                            {veiculo.codigo}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="mt-1">
                        {veiculo.ano && `${veiculo.ano} • `}
                        {veiculo.cor && `${veiculo.cor} • `}
                        {veiculo.placa || 'Sem placa'}
                      </CardDescription>
                    </div>
                    {getStatusBadge()}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{veiculo.clientes?.nome}</span>
                      {veiculo.clientes?.codigo && (
                        <Badge variant="secondary" className="text-xs">
                          {veiculo.clientes.codigo}
                        </Badge>
                      )}
                    </div>
                    {veiculo.combustivel && (
                      <div className="flex items-center gap-2 text-sm">
                        {getCombustivelIcon(veiculo.combustivel)}
                        <span className="text-foreground">{veiculo.combustivel}</span>
                      </div>
                    )}
                    {veiculo.km_atual && (
                      <div className="flex items-center gap-2 text-sm">
                        <Gauge className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">
                          {veiculo.km_atual.toLocaleString('pt-BR')} km
                        </span>
                      </div>
                    )}
                    {veiculo.chassi && (
                      <div className="flex items-center gap-2 text-sm">
                        <Hash className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground text-xs font-mono">
                          {veiculo.chassi}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(veiculo)}>
                      <Edit2 className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(veiculo)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {!isLoading && filteredVeiculos.length === 0 && (
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

      {/* Formulário */}
      <VeiculoForm
        isOpen={showForm}
        onOpenChange={setShowForm}
        veiculo={editingVeiculo}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};