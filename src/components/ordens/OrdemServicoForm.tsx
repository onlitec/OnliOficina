import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Save, X, User, Car, Plus, Trash2, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Cliente {
  id: string;
  nome: string;
  codigo: string;
}

interface Veiculo {
  id: string;
  marca: string;
  modelo: string;
  placa: string;
  ano?: number;
  cor?: string;
}

interface TipoServico {
  id: string;
  nome: string;
  preco_base: number;
}

interface ItemServico {
  id?: string;
  descricao: string;
  tipo_servico_id?: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

interface OrdemServico {
  id?: string;
  codigo?: string;
  numero_os?: string;
  cliente_id: string;
  veiculo_id: string;
  data_entrada: string;
  data_saida?: string;
  km_entrada?: number;
  status: string;
  problema_relatado?: string;
  diagnostico?: string;
  observacoes?: string;
  valor_total: number;
  desconto: number;
  valor_final: number;
}

interface OrdemServicoFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  ordem?: OrdemServico | null;
  onSuccess: () => void;
}

const statusOptions = [
  { value: 'aguardando', label: 'Aguardando', color: 'bg-yellow-500' },
  { value: 'em_andamento', label: 'Em Andamento', color: 'bg-blue-500' },
  { value: 'aguardando_pecas', label: 'Aguardando Peças', color: 'bg-orange-500' },
  { value: 'concluida', label: 'Concluída', color: 'bg-green-500' },
  { value: 'cancelada', label: 'Cancelada', color: 'bg-red-500' },
];

const prioridades = [
  { value: 'baixa', label: 'Baixa', color: 'bg-gray-500' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-500' },
  { value: 'alta', label: 'Alta', color: 'bg-orange-500' },
  { value: 'urgente', label: 'Urgente', color: 'bg-red-500' },
];

export const OrdemServicoForm: React.FC<OrdemServicoFormProps> = ({
  isOpen,
  onOpenChange,
  ordem,
  onSuccess
}) => {
  const [formData, setFormData] = useState<OrdemServico>({
    cliente_id: ordem?.cliente_id || '',
    veiculo_id: ordem?.veiculo_id || '',
    data_entrada: ordem?.data_entrada || new Date().toISOString().split('T')[0],
    data_saida: ordem?.data_saida || '',
    km_entrada: ordem?.km_entrada || 0,
    status: ordem?.status || 'aguardando',
    problema_relatado: ordem?.problema_relatado || '',
    diagnostico: ordem?.diagnostico || '',
    observacoes: ordem?.observacoes || '',
    valor_total: ordem?.valor_total || 0,
    desconto: ordem?.desconto || 0,
    valor_final: ordem?.valor_final || 0,
  });

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [tiposServicos, setTiposServicos] = useState<TipoServico[]>([]);
  const [itensServico, setItensServico] = useState<ItemServico[]>([]);
  const [prioridade, setPrioridade] = useState('normal');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchClientes();
      fetchTiposServicos();
      if (ordem?.id) {
        fetchItensServico(ordem.id);
      }
    }
  }, [isOpen, ordem]);

  useEffect(() => {
    if (formData.cliente_id) {
      fetchVeiculos(formData.cliente_id);
    }
  }, [formData.cliente_id]);

  const fetchClientes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, codigo')
        .eq('user_id', user.id)
        .order('nome');

      if (error) throw error;
      setClientes(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar clientes:', error);
    }
  };

  const fetchVeiculos = async (clienteId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('veiculos')
        .select('id, marca, modelo, placa, ano, cor')
        .eq('user_id', user.id)
        .eq('cliente_id', clienteId)
        .order('marca, modelo');

      if (error) throw error;
      setVeiculos(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar veículos:', error);
    }
  };

  const fetchTiposServicos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tipos_servicos')
        .select('id, nome, preco_base')
        .eq('user_id', user.id)
        .order('nome');

      if (error) throw error;
      setTiposServicos(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar tipos de serviços:', error);
    }
  };

  const fetchItensServico = async (ordemId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('itens_servico')
        .select('*')
        .eq('user_id', user.id)
        .eq('ordem_servico_id', ordemId);

      if (error) throw error;
      setItensServico(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar itens de serviço:', error);
    }
  };

  const addItemServico = () => {
    setItensServico([...itensServico, {
      descricao: '',
      quantidade: 1,
      valor_unitario: 0,
      valor_total: 0
    }]);
  };

  const removeItemServico = (index: number) => {
    setItensServico(itensServico.filter((_, i) => i !== index));
    calcularTotais();
  };

  const updateItemServico = (index: number, field: keyof ItemServico, value: string | number) => {
    const updated = [...itensServico];
    updated[index] = { ...updated[index], [field]: value };
    
    // Recalcular valor total do item
    if (field === 'quantidade' || field === 'valor_unitario') {
      updated[index].valor_total = updated[index].quantidade * updated[index].valor_unitario;
    }
    
    setItensServico(updated);
    
    // Recalcular totais da ordem
    setTimeout(() => calcularTotais(), 0);
  };

  const onTipoServicoChange = (index: number, tipoServicoId: string) => {
    const tipoServico = tiposServicos.find(t => t.id === tipoServicoId);
    if (tipoServico) {
      updateItemServico(index, 'tipo_servico_id', tipoServicoId);
      updateItemServico(index, 'descricao', tipoServico.nome);
      updateItemServico(index, 'valor_unitario', tipoServico.preco_base);
    }
  };

  const calcularTotais = () => {
    const valorTotal = itensServico.reduce((sum, item) => sum + item.valor_total, 0);
    const valorFinal = valorTotal - formData.desconto;
    
    setFormData(prev => ({
      ...prev,
      valor_total: valorTotal,
      valor_final: valorFinal
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const ordemData: any = {
        ...formData,
        user_id: user.id
      };

      let savedOrdem;

      if (ordem?.id) {
        // Atualizar ordem existente
        const { data, error } = await supabase
          .from('ordens_servico')
          .update(ordemData)
          .eq('id', ordem.id)
          .select()
          .single();

        if (error) throw error;
        savedOrdem = data;

        toast({
          title: "Ordem de serviço atualizada!",
          description: `OS ${savedOrdem.numero_os} foi atualizada com sucesso.`,
        });
      } else {
        // Criar nova ordem
        const { data, error } = await supabase
          .from('ordens_servico')
          .insert(ordemData)
          .select()
          .single();

        if (error) throw error;
        savedOrdem = data;

        // Criar itens de serviço
        if (itensServico.length > 0) {
          const itensData = itensServico.map(item => ({
            ...item,
            ordem_servico_id: savedOrdem.id,
            user_id: user.id
          }));

          const { error: itensError } = await supabase
            .from('itens_servico')
            .insert(itensData);

          if (itensError) throw itensError;
        }

        toast({
          title: "Ordem de serviço criada!",
          description: `OS ${savedOrdem.numero_os} foi criada com sucesso.`,
        });
      }

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        cliente_id: '',
        veiculo_id: '',
        data_entrada: new Date().toISOString().split('T')[0],
        data_saida: '',
        km_entrada: 0,
        status: 'aguardando',
        problema_relatado: '',
        diagnostico: '',
        observacoes: '',
        valor_total: 0,
        desconto: 0,
        valor_final: 0,
      });
      setItensServico([]);
      setPrioridade('normal');

    } catch (error: any) {
      toast({
        title: "Erro ao salvar ordem de serviço",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCliente = clientes.find(c => c.id === formData.cliente_id);
  const selectedVeiculo = veiculos.find(v => v.id === formData.veiculo_id);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {ordem ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
          </DialogTitle>
          <DialogDescription>
            {ordem 
              ? 'Edite as informações da ordem de serviço'
              : 'Preencha os dados para criar uma nova ordem de serviço'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Informações Básicas</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <Select
                    value={formData.cliente_id}
                    onValueChange={(value) => setFormData({ ...formData, cliente_id: value, veiculo_id: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.codigo} - {cliente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Veículo *</Label>
                  <Select
                    value={formData.veiculo_id}
                    onValueChange={(value) => setFormData({ ...formData, veiculo_id: value })}
                    disabled={!formData.cliente_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o veículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {veiculos.map((veiculo) => (
                        <SelectItem key={veiculo.id} value={veiculo.id}>
                          {veiculo.marca} {veiculo.modelo} - {veiculo.placa}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${status.color}`} />
                            {status.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data de Entrada</Label>
                  <Input
                    type="date"
                    value={formData.data_entrada}
                    onChange={(e) => setFormData({ ...formData, data_entrada: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data de Saída</Label>
                  <Input
                    type="date"
                    value={formData.data_saida}
                    onChange={(e) => setFormData({ ...formData, data_saida: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>KM Entrada</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.km_entrada || ''}
                    onChange={(e) => setFormData({ ...formData, km_entrada: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Problema Relatado</Label>
                  <Textarea
                    placeholder="Descreva o problema relatado pelo cliente..."
                    value={formData.problema_relatado}
                    onChange={(e) => setFormData({ ...formData, problema_relatado: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Diagnóstico</Label>
                  <Textarea
                    placeholder="Diagnóstico técnico..."
                    value={formData.diagnostico}
                    onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Observações adicionais..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Itens de Serviço */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Itens de Serviço</h3>
                <Button type="button" onClick={addItemServico} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {itensServico.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum item adicionado. Clique em "Adicionar Item" para começar.
                </p>
              ) : (
                itensServico.map((item, index) => (
                  <Card key={index} className="relative">
                    <CardContent className="p-4">
                      <div className="absolute top-2 right-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItemServico(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-4">
                        <div className="space-y-2 md:col-span-2">
                          <Label>Tipo de Serviço</Label>
                          <Select
                            value={item.tipo_servico_id || ''}
                            onValueChange={(value) => onTipoServicoChange(index, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {tiposServicos.map((tipo) => (
                                <SelectItem key={tipo.id} value={tipo.id}>
                                  {tipo.nome} - R$ {tipo.preco_base.toFixed(2)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2 md:col-span-2">
                          <Label>Descrição *</Label>
                          <Input
                            placeholder="Descrição do serviço/peça"
                            value={item.descricao}
                            onChange={(e) => updateItemServico(index, 'descricao', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Qtd</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantidade}
                            onChange={(e) => updateItemServico(index, 'quantidade', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Valor Unit.</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.valor_unitario}
                            onChange={(e) => updateItemServico(index, 'valor_unitario', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        
                        <div className="space-y-2 md:col-span-6">
                          <div className="flex justify-end">
                            <span className="text-lg font-semibold">
                              Total: R$ {item.valor_total.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          {/* Totais */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Totais</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Valor Total</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor_total}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Desconto</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.desconto}
                    onChange={(e) => {
                      const desconto = parseFloat(e.target.value) || 0;
                      setFormData(prev => ({
                        ...prev,
                        desconto,
                        valor_final: prev.valor_total - desconto
                      }));
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Valor Final</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor_final}
                    readOnly
                    className="bg-muted font-bold text-lg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

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
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Salvando...' : ordem ? 'Atualizar' : 'Criar OS'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};