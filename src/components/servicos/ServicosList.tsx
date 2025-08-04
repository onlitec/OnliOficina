import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit, Trash2, Settings, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TipoServico {
  id: string;
  nome: string;
  descricao?: string;
  preco_base: number;
  tempo_estimado?: number;
  created_at: string;
}

export const ServicosList: React.FC = () => {
  const [servicos, setServicos] = useState<TipoServico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingServico, setEditingServico] = useState<TipoServico | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco_base: '',
    tempo_estimado: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchServicos();
  }, []);

  const fetchServicos = async () => {
    try {
      const { data, error } = await supabase
        .from('tipos_servicos')
        .select('*')
        .order('nome');

      if (error) throw error;
      setServicos(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar serviços",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const servicoData = {
        nome: formData.nome,
        descricao: formData.descricao || null,
        preco_base: parseFloat(formData.preco_base) || 0,
        tempo_estimado: formData.tempo_estimado ? parseInt(formData.tempo_estimado) : 60,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      };

      if (editingServico) {
        const { error } = await supabase
          .from('tipos_servicos')
          .update(servicoData)
          .eq('id', editingServico.id);

        if (error) throw error;

        toast({
          title: "Serviço atualizado!",
          description: "O tipo de serviço foi atualizado com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from('tipos_servicos')
          .insert([servicoData]);

        if (error) throw error;

        toast({
          title: "Serviço criado!",
          description: "O tipo de serviço foi criado com sucesso.",
        });
      }

      setIsDialogOpen(false);
      setEditingServico(null);
      setFormData({
        nome: '',
        descricao: '',
        preco_base: '',
        tempo_estimado: '',
      });
      fetchServicos();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (servico: TipoServico) => {
    if (!confirm(`Tem certeza que deseja excluir o serviço "${servico.nome}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tipos_servicos')
        .delete()
        .eq('id', servico.id);

      if (error) throw error;

      toast({
        title: "Serviço excluído!",
        description: "O tipo de serviço foi excluído com sucesso.",
      });

      fetchServicos();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (servico: TipoServico) => {
    setEditingServico(servico);
    setFormData({
      nome: servico.nome,
      descricao: servico.descricao || '',
      preco_base: servico.preco_base.toString(),
      tempo_estimado: servico.tempo_estimado?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingServico(null);
    setFormData({
      nome: '',
      descricao: '',
      preco_base: '',
      tempo_estimado: '',
    });
    setIsDialogOpen(true);
  };

  const filteredServicos = servicos.filter(servico =>
    servico.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    servico.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} className="bg-primary hover:bg-primary-hover">
              <Plus className="w-4 h-4 mr-2" />
              Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingServico ? 'Editar Tipo de Serviço' : 'Novo Tipo de Serviço'}
              </DialogTitle>
              <DialogDescription>
                {editingServico 
                  ? 'Edite as informações do tipo de serviço'
                  : 'Preencha os dados para criar um novo tipo de serviço'
                }
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
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
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descrição detalhada do serviço..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preco_base">Preço Base (R$)</Label>
                  <Input
                    id="preco_base"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.preco_base}
                    onChange={(e) => setFormData({ ...formData, preco_base: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tempo_estimado">Tempo Estimado (min)</Label>
                  <Input
                    id="tempo_estimado"
                    type="number"
                    placeholder="60"
                    value={formData.tempo_estimado}
                    onChange={(e) => setFormData({ ...formData, tempo_estimado: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Salvando...' : editingServico ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Serviços</CardTitle>
          <CardDescription>
            Encontre serviços por nome ou descrição
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Tipos de Serviços</CardTitle>
          <CardDescription>
            {filteredServicos.length} serviço(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando serviços...</p>
            </div>
          ) : filteredServicos.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum serviço encontrado
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Tente ajustar os termos de busca' : 'Comece criando seu primeiro tipo de serviço'}
              </p>
              {!searchTerm && (
                <Button onClick={openNewDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Serviço
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Preço Base</TableHead>
                    <TableHead>Tempo Estimado</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServicos.map((servico) => (
                    <TableRow key={servico.id}>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-mono">
                          SRV-{new Date(servico.created_at).getFullYear()}-{String(filteredServicos.indexOf(servico) + 1).padStart(4, '0')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {servico.nome}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="truncate" title={servico.descricao || ''}>
                          {servico.descricao || '-'}
                        </p>
                      </TableCell>
                      <TableCell className="font-medium">
                        R$ {servico.preco_base.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          {servico.tempo_estimado || 60} min
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(servico)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(servico)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};