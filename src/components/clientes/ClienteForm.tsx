import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Save, X, Upload, Image as ImageIcon, Car, Plus, Trash2, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';

interface Cliente {
  id?: string;
  codigo?: string;
  nome: string;
  cpf_cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
}

interface Veiculo {
  id?: string;
  marca: string;
  modelo: string;
  ano?: number;
  cor?: string;
  placa?: string;
  chassi?: string;
  combustivel?: string;
  km_atual?: number;
  observacoes?: string;
  foto?: string;
  photoFile?: File | null;
  photoPreview?: string | null;
}

interface ClienteFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Cliente | null;
  onSuccess: () => void;
}

export const ClienteForm: React.FC<ClienteFormProps> = ({
  isOpen,
  onOpenChange,
  cliente,
  onSuccess
}) => {
  const [formData, setFormData] = useState<Cliente>({
    nome: cliente?.nome || '',
    cpf_cnpj: cliente?.cpf_cnpj || '',
    telefone: cliente?.telefone || '',
    email: cliente?.email || '',
    endereco: cliente?.endereco || '',
    cidade: cliente?.cidade || '',
    estado: cliente?.estado || '',
    cep: cliente?.cep || '',
    observacoes: cliente?.observacoes || ''
  });
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleVehiclePhotoChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateVeiculo(index, 'photoPreview', e.target?.result as string);
        updateVeiculo(index, 'photoFile', file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = async (index: number) => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image.dataUrl) {
        updateVeiculo(index, 'photoPreview', image.dataUrl);
        
        // Converter dataUrl para File
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `vehicle-${index}-${Date.now()}.jpg`, { type: 'image/jpeg' });
        updateVeiculo(index, 'photoFile', file);
      }
    } catch (error) {
      toast({
        title: "Erro na câmera",
        description: "Não foi possível capturar a foto",
        variant: "destructive",
      });
    }
  };

  const uploadVehiclePhoto = async (veiculoId: string, photoFile: File): Promise<string | null> => {
    if (!photoFile) return null;

    try {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `vehicles/${veiculoId}/photo.${fileExt}`;

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

  const addVeiculo = () => {
    setVeiculos([...veiculos, {
      marca: '',
      modelo: '',
      ano: new Date().getFullYear(),
      cor: '',
      placa: '',
      chassi: '',
      combustivel: '',
      km_atual: 0,
      observacoes: '',
      photoFile: null,
      photoPreview: null
    }]);
  };

  const removeVeiculo = (index: number) => {
    setVeiculos(veiculos.filter((_, i) => i !== index));
  };

  const updateVeiculo = (index: number, field: keyof Veiculo, value: any) => {
    const updated = [...veiculos];
    updated[index] = { ...updated[index], [field]: value };
    setVeiculos(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const clienteData = {
        ...formData,
        user_id: user.id
      };

      let savedCliente;

      if (cliente?.id) {
        // Atualizar cliente existente
        const { data, error } = await supabase
          .from('clientes')
          .update(clienteData)
          .eq('id', cliente.id)
          .select()
          .single();

        if (error) throw error;
        savedCliente = data;

        toast({
          title: "Cliente atualizado!",
          description: `${formData.nome} foi atualizado com sucesso.`,
        });
      } else {
        // Criar novo cliente
        const { data, error } = await supabase
          .from('clientes')
          .insert([clienteData])
          .select()
          .single();

        if (error) throw error;
        savedCliente = data;

        // Criar veículos associados ao cliente
        if (veiculos.length > 0) {
          const veiculosValidados = veiculos.filter(v => v.marca && v.modelo);
          
          for (const veiculo of veiculosValidados) {
            const veiculoData = {
              marca: veiculo.marca,
              modelo: veiculo.modelo,
              ano: veiculo.ano,
              cor: veiculo.cor,
              placa: veiculo.placa,
              chassi: veiculo.chassi,
              combustivel: veiculo.combustivel,
              km_atual: veiculo.km_atual,
              observacoes: veiculo.observacoes,
              cliente_id: savedCliente.id,
              user_id: user.id
            };

            const { data: savedVeiculo, error: veiculoError } = await supabase
              .from('veiculos')
              .insert([veiculoData])
              .select()
              .single();

            if (veiculoError) throw veiculoError;

            // Upload da foto se houver
            if (veiculo.photoFile && savedVeiculo) {
              const photoUrl = await uploadVehiclePhoto(savedVeiculo.id, veiculo.photoFile);
              if (photoUrl) {
                await supabase
                  .from('veiculos')
                  .update({ foto: photoUrl })
                  .eq('id', savedVeiculo.id);
              }
            }
          }
        }

        toast({
          title: "Cliente criado!",
          description: `${formData.nome} foi cadastrado com código ${savedCliente.codigo}.${veiculos.filter(v => v.marca && v.modelo).length > 0 ? ` ${veiculos.filter(v => v.marca && v.modelo).length} veículo(s) adicionado(s).` : ''}`,
        });
      }

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        nome: '',
        cpf_cnpj: '',
        telefone: '',
        email: '',
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
        observacoes: ''
      });
      setVeiculos([]);

    } catch (error: any) {
      toast({
        title: "Erro ao salvar cliente",
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
            <User className="w-5 h-5 text-primary" />
            {cliente ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
          <DialogDescription>
            {cliente 
              ? 'Edite as informações do cliente'
              : 'Preencha os dados para cadastrar um novo cliente'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados do Cliente */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  placeholder="Nome do cliente"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                <Input
                  id="cpf_cnpj"
                  placeholder="000.000.000-00"
                  value={formData.cpf_cnpj}
                  onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="cliente@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  placeholder="00000-000"
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  placeholder="Rua, número"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  placeholder="Nome da cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  placeholder="UF"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Informações adicionais sobre o cliente..."
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          {/* Seção de Veículos - apenas para novos clientes */}
          {!cliente && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Veículos do Cliente</h3>
                  </div>
                  <Button type="button" onClick={addVeiculo} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Veículo
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {veiculos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum veículo adicionado. Clique em "Adicionar Veículo" para começar.
                  </p>
                ) : (
                  veiculos.map((veiculo, index) => (
                    <Card key={index} className="relative">
                      <CardContent className="p-4">
                        <div className="absolute top-2 right-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeVeiculo(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {/* Seção de Foto do Veículo */}
                        <div className="mb-6">
                          <Label className="text-sm font-medium">Foto do Veículo</Label>
                          <div className="mt-2 space-y-4">
                            {veiculo.photoPreview ? (
                              <div className="relative">
                                <img 
                                  src={veiculo.photoPreview} 
                                  alt="Preview do veículo" 
                                  className="w-full h-40 object-cover rounded-lg"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="absolute top-2 right-2"
                                  onClick={() => {
                                    updateVeiculo(index, 'photoPreview', null);
                                    updateVeiculo(index, 'photoFile', null);
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
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div className="relative">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleVehiclePhotoChange(index, e)}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <Button type="button" variant="outline" className="w-full">
                                  <Upload className="w-4 h-4 mr-2" />
                                  Galeria
                                </Button>
                              </div>
                              
                              <Button 
                                type="button" 
                                variant="outline" 
                                className="w-full"
                                onClick={() => handleCameraCapture(index)}
                              >
                                <Camera className="w-4 h-4 mr-2" />
                                Câmera
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Marca *</Label>
                            <Input
                              placeholder="Ex: Toyota"
                              value={veiculo.marca}
                              onChange={(e) => updateVeiculo(index, 'marca', e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Modelo *</Label>
                            <Input
                              placeholder="Ex: Corolla"
                              value={veiculo.modelo}
                              onChange={(e) => updateVeiculo(index, 'modelo', e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Ano</Label>
                            <Input
                              type="number"
                              placeholder="2024"
                              value={veiculo.ano || ''}
                              onChange={(e) => updateVeiculo(index, 'ano', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Cor</Label>
                            <Input
                              placeholder="Ex: Branco"
                              value={veiculo.cor}
                              onChange={(e) => updateVeiculo(index, 'cor', e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Placa</Label>
                            <Input
                              placeholder="ABC-1234"
                              value={veiculo.placa}
                              onChange={(e) => updateVeiculo(index, 'placa', e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Combustível</Label>
                            <Select
                              value={veiculo.combustivel}
                              onValueChange={(value) => updateVeiculo(index, 'combustivel', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="gasolina">Gasolina</SelectItem>
                                <SelectItem value="etanol">Etanol</SelectItem>
                                <SelectItem value="flex">Flex</SelectItem>
                                <SelectItem value="diesel">Diesel</SelectItem>
                                <SelectItem value="gnv">GNV</SelectItem>
                                <SelectItem value="eletrico">Elétrico</SelectItem>
                                <SelectItem value="hibrido">Híbrido</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Chassi</Label>
                            <Input
                              placeholder="Número do chassi"
                              value={veiculo.chassi}
                              onChange={(e) => updateVeiculo(index, 'chassi', e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>KM Atual</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={veiculo.km_atual || ''}
                              onChange={(e) => updateVeiculo(index, 'km_atual', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          
                          <div className="space-y-2 md:col-span-3">
                            <Label>Observações</Label>
                            <Textarea
                              placeholder="Observações sobre o veículo..."
                              value={veiculo.observacoes}
                              onChange={(e) => updateVeiculo(index, 'observacoes', e.target.value)}
                              rows={2}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          )}

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
              {isLoading ? 'Salvando...' : cliente ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};