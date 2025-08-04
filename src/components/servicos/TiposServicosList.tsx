import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Settings, Search, Plus, Edit, Trash2, Wrench, Clock, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TipoServico {
  id: string;
  nome: string;
  descricao?: string;
  preco_base: number;
  tempo_estimado: number;
  created_at: string;
  updated_at: string;
}

interface TipoServicoFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tipoServico?: TipoServico | null;
  onSuccess: () => void;
}

const TipoServicoForm: React.FC<TipoServicoFormProps> = ({
  isOpen,
  onOpenChange,
  tipoServico,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    nome: tipoServico?.nome || '',
    descricao: tipoServico?.descricao || '',
    preco_base: tipoServico?.preco_base || 0,
    tempo_estimado: tipoServico?.tempo_estimado || 60,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const tipoServicoData = {
        ...formData,
        user_id: user.id
      };

      if (tipoServico?.id) {
        // Atualizar tipo de serviço existente
        const { error } = await supabase
          .from('tipos_servicos')
          .update(tipoServicoData)
          .eq('id', tipoServico.id);

        if (error) throw error;

        toast({
          title: "Tipo de serviço atualizado!",
          description: `${formData.nome} foi atualizado com sucesso.`,
        });
      } else {
        // Criar novo tipo de serviço
        const { error } = await supabase
          .from('tipos_servicos')
          .insert(tipoServicoData);

        if (error) throw error;

        toast({
          title: "Tipo de serviço criado!",
          description: `${formData.nome} foi criado com sucesso.`,
        });
      }

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        nome: '',
        descricao: '',
        preco_base: 0,
        tempo_estimado: 60,
      });

    } catch (error: any) {
      toast({
        title: "Erro ao salvar tipo de serviço",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            {tipoServico ? 'Editar Tipo de Serviço' : 'Novo Tipo de Serviço'}
          </DialogTitle>
          <DialogDescription>
            {tipoServico 
              ? 'Edite as informações do tipo de serviço'
              : 'Preencha os dados para cadastrar um novo tipo de serviço'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nome">Nome do Serviço *</Label>
              <Input
                id="nome"
                placeholder="Ex: Troca de óleo"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco_base">Preço Base (R$) *</Label>
              <Input
                id="preco_base"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.preco_base}
                onChange={(e) => setFormData({ ...formData, preco_base: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tempo_estimado">Tempo Estimado (min)</Label>
              <Input
                id="tempo_estimado"
                type="number"
                min="1"
                placeholder="60"
                value={formData.tempo_estimado}
                onChange={(e) => setFormData({ ...formData, tempo_estimado: parseInt(e.target.value) || 60 })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Descrição detalhada do serviço..."
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : tipoServico ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const TiposServicosList: React.FC = () => {
  const [tiposServicos, setTiposServicos] = useState<TipoServico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTipoServico, setEditingTipoServico] = useState<TipoServico | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTiposServicos();
  }, []);

  const fetchTiposServicos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tipos_servicos')
        .select('*')
        .eq('user_id', user.id)
        .order('nome');

      if (error) throw error;
      setTiposServicos(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar tipos de serviços",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (tipoServico: TipoServico) => {
    setEditingTipoServico(tipoServico);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tipos_servicos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Tipo de serviço removido!",
        description: "O tipo de serviço foi removido com sucesso.",
      });

      fetchTiposServicos();
    } catch (error: any) {
      toast({
        title: "Erro ao remover tipo de serviço",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    fetchTiposServicos();
    setEditingTipoServico(null);
  };

  const handleNewTipoServico = () => {
    setEditingTipoServico(null);
    setShowForm(true);
  };

  const filteredTiposServicos = tiposServicos.filter(tipo =>
    tipo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tipo.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando tipos de serviços...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Settings className="w-8 h-8 text-primary" />
            Tipos de Serviços
          </h1>
          <p className="text-muted-foreground">
            Gerencie os tipos de serviços oferecidos pela oficina
          </p>
        </div>
        <Button className="flex items-center gap-2" onClick={handleNewTipoServico}>
          <Plus className="w-4 h-4" />
          Novo Tipo de Serviço
        </Button>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tiposServicos.length}</div>
            <p className="text-xs text-muted-foreground">
              tipos de serviços cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {tiposServicos.length > 0 
                ? (tiposServicos.reduce((sum, tipo) => sum + tipo.preco_base, 0) / tiposServicos.length).toFixed(2)
                : '0.00'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              preço médio dos serviços
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tiposServicos.length > 0 
                ? Math.round(tiposServicos.reduce((sum, tipo) => sum + tipo.tempo_estimado, 0) / tiposServicos.length)
                : 0
              } min
            </div>
            <p className="text-xs text-muted-foreground">
              tempo médio estimado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Tipos de Serviços */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTiposServicos.length > 0 ? (
          filteredTiposServicos.map((tipoServico) => (
            <Card key={tipoServico.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{tipoServico.nome}</CardTitle>
                    {tipoServico.descricao && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {tipoServico.descricao}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Preço Base:</span>
                    <Badge variant="secondary" className="text-sm font-semibold">
                      R$ {tipoServico.preco_base.toFixed(2)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tempo Estimado:</span>
                    <Badge variant="outline" className="text-sm">
                      {tipoServico.tempo_estimado} min
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(tipoServico)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(tipoServico.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <p className="text-center text-muted-foreground py-8">
              {searchTerm ? 'Nenhum tipo de serviço encontrado com esse termo.' : 'Nenhum tipo de serviço cadastrado.'}
            </p>
          </div>
        )}
      </div>

      <TipoServicoForm
        isOpen={showForm}
        onOpenChange={setShowForm}
        tipoServico={editingTipoServico}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};