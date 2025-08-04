import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Car, Save, X, Upload, Image as ImageIcon, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Cliente {
  id: string;
  nome: string;
  codigo?: string;
}

interface Veiculo {
  id?: string;
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
}

interface VeiculoFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  veiculo?: Veiculo | null;
  onSuccess: () => void;
}

export const VeiculoForm: React.FC<VeiculoFormProps> = ({
  isOpen,
  onOpenChange,
  veiculo,
  onSuccess
}) => {
  const [formData, setFormData] = useState<Veiculo>({
    marca: veiculo?.marca || '',
    modelo: veiculo?.modelo || '',
    ano: veiculo?.ano || undefined,
    cor: veiculo?.cor || '',
    placa: veiculo?.placa || '',
    combustivel: veiculo?.combustivel || '',
    km_atual: veiculo?.km_atual || undefined,
    chassi: veiculo?.chassi || '',
    observacoes: veiculo?.observacoes || '',
    cliente_id: veiculo?.cliente_id || ''
  });
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchClientes();
    }
  }, [isOpen]);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, codigo')
        .order('nome');

      if (error) throw error;
      setClientes(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar clientes",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (veiculoId: string): Promise<string | null> => {
    if (!photoFile) return null;

    try {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `veiculos/${veiculoId}/photo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('vehicle-photos')
        .upload(fileName, photoFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('vehicle-photos')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error: any) {
      console.error('Erro ao fazer upload da foto:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const veiculoData = {
        ...formData,
        user_id: user.id
      };

      let savedVeiculo;

      if (veiculo?.id) {
        // Atualizar veículo existente
        const { data, error } = await supabase
          .from('veiculos')
          .update(veiculoData)
          .eq('id', veiculo.id)
          .select()
          .single();

        if (error) throw error;
        savedVeiculo = data;

        toast({
          title: "Veículo atualizado!",
          description: `${formData.marca} ${formData.modelo} foi atualizado com sucesso.`,
        });
      } else {
        // Criar novo veículo
        const { data, error } = await supabase
          .from('veiculos')
          .insert([veiculoData])
          .select()
          .single();

        if (error) throw error;
        savedVeiculo = data;

        toast({
          title: "Veículo criado!",
          description: `${formData.marca} ${formData.modelo} foi cadastrado com código ${savedVeiculo.codigo}.`,
        });
      }

      // Upload da foto se houver
      if (photoFile && savedVeiculo) {
        await uploadPhoto(savedVeiculo.id);
      }

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        marca: '',
        modelo: '',
        ano: undefined,
        cor: '',
        placa: '',
        combustivel: '',
        km_atual: undefined,
        chassi: '',
        observacoes: '',
        cliente_id: ''
      });
      setPhotoFile(null);
      setPhotoPreview(null);

    } catch (error: any) {
      toast({
        title: "Erro ao salvar veículo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5 text-primary" />
            {veiculo ? 'Editar Veículo' : 'Novo Veículo'}
          </DialogTitle>
          <DialogDescription>
            {veiculo 
              ? 'Edite as informações do veículo'
              : 'Preencha os dados para cadastrar um novo veículo'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Foto do Veículo */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-4">
                  <Label className="text-sm font-medium">Foto do Veículo</Label>
                  <div className="mt-2 space-y-4">
                    {photoPreview ? (
                      <div className="relative">
                        <img 
                          src={photoPreview} 
                          alt="Preview" 
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setPhotoPreview(null);
                            setPhotoFile(null);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                        <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Nenhuma foto selecionada
                        </p>
                      </div>
                    )}
                    
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Button type="button" variant="outline" className="w-full">
                        <Upload className="w-4 h-4 mr-2" />
                        Selecionar Foto
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Dados do Veículo */}
            <div className="lg:col-span-2 space-y-4">
              {/* Cliente */}
              <div className="space-y-2">
                <Label htmlFor="cliente_id">Cliente *</Label>
                <Select
                  value={formData.cliente_id}
                  onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {cliente.nome}
                          {cliente.codigo && (
                            <span className="text-xs text-muted-foreground">({cliente.codigo})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="marca">Marca *</Label>
                  <Input
                    id="marca"
                    placeholder="Honda, Toyota, Ford..."
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modelo">Modelo *</Label>
                  <Input
                    id="modelo"
                    placeholder="Civic, Corolla, Ka..."
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ano">Ano</Label>
                  <Input
                    id="ano"
                    type="number"
                    min="1900"
                    max="2030"
                    placeholder="2020"
                    value={formData.ano || ''}
                    onChange={(e) => setFormData({ ...formData, ano: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cor">Cor</Label>
                  <Input
                    id="cor"
                    placeholder="Prata, Branco, Preto..."
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="placa">Placa</Label>
                  <Input
                    id="placa"
                    placeholder="ABC-1234"
                    value={formData.placa}
                    onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="combustivel">Combustível</Label>
                  <Select
                    value={formData.combustivel}
                    onValueChange={(value) => setFormData({ ...formData, combustivel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o combustível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Flex">Flex</SelectItem>
                      <SelectItem value="Gasolina">Gasolina</SelectItem>
                      <SelectItem value="Etanol">Etanol</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="GNV">GNV</SelectItem>
                      <SelectItem value="Elétrico">Elétrico</SelectItem>
                      <SelectItem value="Híbrido">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="km_atual">Quilometragem Atual</Label>
                  <Input
                    id="km_atual"
                    type="number"
                    min="0"
                    placeholder="45000"
                    value={formData.km_atual || ''}
                    onChange={(e) => setFormData({ ...formData, km_atual: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chassi">Chassi</Label>
                  <Input
                    id="chassi"
                    placeholder="Número do chassi"
                    value={formData.chassi}
                    onChange={(e) => setFormData({ ...formData, chassi: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Informações adicionais sobre o veículo..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                />
              </div>
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
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Salvando...' : veiculo ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};