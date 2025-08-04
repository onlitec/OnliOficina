import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ItemServico {
  id: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  tipo_servico_id?: string;
  tipo_servico?: {
    nome: string;
    preco_base: number;
    tempo_estimado: number;
  };
}

interface ItensServicoManagerProps {
  ordemId: string;
  isReadOnly?: boolean;
  onTotalChange?: (total: number) => void;
}

export const ItensServicoManager: React.FC<ItensServicoManagerProps> = ({
  ordemId,
  isReadOnly = false,
  onTotalChange
}) => {
  const [itens, setItens] = useState<ItemServico[]>([]);
  const [tiposServicos, setTiposServicos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemServico | null>(null);
  const [formData, setFormData] = useState({
    tipo_servico_id: '',
    descricao: '',
    quantidade: '1',
    valor_unitario: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchItens();
    fetchTiposServicos();
  }, [ordemId]);

  const fetchItens = async () => {
    try {
      // Usar a API REST diretamente para GET
      const { data, error } = await supabase
        .from('itens_servico')
        .select(`
          *,
          tipo_servico:tipos_servicos(nome, preco_base, tempo_estimado)
        `)
        .eq('ordem_servico_id', ordemId)
        .order('created_at');

      if (error) throw error;

      setItens(data || []);
      
      // Calcular total e notificar componente pai
      const total = data?.reduce((sum: number, item: ItemServico) => sum + item.valor_total, 0) || 0;
      onTotalChange?.(total);
    } catch (error: any) {
      console.error('Erro ao carregar itens:', error);
      toast({
        title: "Erro ao carregar itens",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTiposServicos = async () => {
    try {
      const { data, error } = await supabase
        .from('tipos_servicos')
        .select('*')
        .order('nome');

      if (error) throw error;
      setTiposServicos(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar tipos de serviços:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const itemData = {
        ordem_servico_id: ordemId,
        tipo_servico_id: formData.tipo_servico_id || null,
        descricao: formData.descricao,
        quantidade: parseInt(formData.quantidade) || 1,
        valor_unitario: parseFloat(formData.valor_unitario) || 0,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('itens_servico')
          .update({
            tipo_servico_id: itemData.tipo_servico_id,
            descricao: itemData.descricao,
            quantidade: itemData.quantidade,
            valor_unitario: itemData.valor_unitario,
            valor_total: itemData.quantidade * itemData.valor_unitario,
          })
          .eq('id', editingItem.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('itens_servico')
          .insert({
            ...itemData,
            valor_total: itemData.quantidade * itemData.valor_unitario,
          });
        
        if (error) throw error;
      }
      toast({
        title: editingItem ? "Item atualizado!" : "Item adicionado!",
        description: "O item foi salvo com sucesso.",
      });

      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({
        tipo_servico_id: '',
        descricao: '',
        quantidade: '1',
        valor_unitario: '',
      });
      fetchItens();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar item",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (item: ItemServico) => {
    if (!confirm(`Tem certeza que deseja excluir o item "${item.descricao}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('itens_servico')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: "Item excluído!",
        description: "O item foi excluído com sucesso.",
      });
      fetchItens();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (item: ItemServico) => {
    setEditingItem(item);
    setFormData({
      tipo_servico_id: item.tipo_servico_id || '',
      descricao: item.descricao,
      quantidade: item.quantidade.toString(),
      valor_unitario: item.valor_unitario.toString(),
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingItem(null);
    setFormData({
      tipo_servico_id: '',
      descricao: '',
      quantidade: '1',
      valor_unitario: '',
    });
    setIsDialogOpen(true);
  };

  const handleTipoServicoChange = (tipoId: string) => {
    const tipo = tiposServicos.find(t => t.id === tipoId);
    if (tipo) {
      setFormData({
        ...formData,
        tipo_servico_id: tipoId,
        descricao: tipo.nome,
        valor_unitario: tipo.preco_base.toString(),
      });
    } else {
      setFormData({
        ...formData,
        tipo_servico_id: tipoId,
      });
    }
  };

  const total = itens.reduce((sum, item) => sum + item.valor_total, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Itens de Serviço
            </CardTitle>
            <CardDescription>
              Gerencie os serviços desta ordem
            </CardDescription>
          </div>
          {!isReadOnly && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewDialog} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? 'Editar Item' : 'Novo Item de Serviço'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingItem 
                      ? 'Edite as informações do item'
                      : 'Adicione um novo item à ordem de serviço'
                    }
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo_servico_id">Tipo de Serviço</Label>
                    <Select
                      value={formData.tipo_servico_id}
                      onValueChange={handleTipoServicoChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione ou deixe em branco para personalizar" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposServicos.map(tipo => (
                          <SelectItem key={tipo.id} value={tipo.id}>
                            {tipo.nome} - R$ {tipo.preco_base.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição *</Label>
                    <Textarea
                      id="descricao"
                      placeholder="Descrição do serviço..."
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      required
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantidade">Quantidade</Label>
                      <Input
                        id="quantidade"
                        type="number"
                        min="1"
                        step="1"
                        value={formData.quantidade}
                        onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="valor_unitario">Valor Unitário (R$)</Label>
                      <Input
                        id="valor_unitario"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.valor_unitario}
                        onChange={(e) => setFormData({ ...formData, valor_unitario: e.target.value })}
                        required
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
                      {isLoading ? 'Salvando...' : editingItem ? 'Atualizar' : 'Adicionar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando itens...</p>
          </div>
        ) : itens.length === 0 ? (
          <div className="text-center py-8">
            <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum item adicionado
            </h3>
            <p className="text-muted-foreground mb-4">
              Adicione serviços a esta ordem para começar
            </p>
            {!isReadOnly && (
              <Button onClick={openNewDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Item
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Valor Unit.</TableHead>
                    <TableHead>Total</TableHead>
                    {!isReadOnly && <TableHead>Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.descricao}</p>
                          {item.tipo_servico && (
                            <p className="text-sm text-muted-foreground">
                              {item.tipo_servico.nome}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.quantidade}</TableCell>
                      <TableCell>R$ {item.valor_unitario.toFixed(2)}</TableCell>
                      <TableCell className="font-medium">
                        R$ {item.valor_total.toFixed(2)}
                      </TableCell>
                      {!isReadOnly && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(item)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-lg font-semibold">
                  Total: R$ {total.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};