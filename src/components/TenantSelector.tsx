import React, { useState } from 'react';
import { useTenant } from '@/hooks/useTenant';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface TenantSelectorProps {
  className?: string;
}

export const TenantSelector: React.FC<TenantSelectorProps> = ({ className }) => {
  const {
    currentTenant,
    userTenants,
    switchTenant,
    createTenant,
    loading
  } = useTenant();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantDescription, setNewTenantDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSwitchTenant = async (tenantId: string) => {
    try {
      await switchTenant(tenantId);
      toast.success('Oficina alterada com sucesso!');
    } catch (error) {
      toast.error('Erro ao alterar oficina');
    }
  };

  const handleCreateTenant = async () => {
    if (!newTenantName.trim()) {
      toast.error('Nome da oficina é obrigatório');
      return;
    }

    setCreating(true);
    try {
      await createTenant({
        name: newTenantName.trim(),
        description: newTenantDescription.trim() || undefined
      });
      
      setNewTenantName('');
      setNewTenantDescription('');
      setIsCreateDialogOpen(false);
      toast.success('Oficina criada com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar oficina');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Building2 className="h-4 w-4 animate-pulse" />
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Building2 className="h-4 w-4" />
      
      <Select
        value={currentTenant?.id || ''}
        onValueChange={handleSwitchTenant}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Selecionar oficina" />
        </SelectTrigger>
        <SelectContent>
          {userTenants.map((tenant) => (
            <SelectItem key={tenant.id} value={tenant.id}>
              <div className="flex flex-col">
                <span className="font-medium">{tenant.nome}</span>
                {tenant.slug && (
                  <span className="text-xs text-muted-foreground">
                    {tenant.slug}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Oficina</DialogTitle>
            <DialogDescription>
              Crie uma nova oficina para gerenciar seus serviços e clientes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="tenant-name">Nome da Oficina *</Label>
              <Input
                id="tenant-name"
                value={newTenantName}
                onChange={(e) => setNewTenantName(e.target.value)}
                placeholder="Ex: Oficina Central"
                disabled={creating}
              />
            </div>
            
            <div>
              <Label htmlFor="tenant-description">Descrição (opcional)</Label>
              <Input
                id="tenant-description"
                value={newTenantDescription}
                onChange={(e) => setNewTenantDescription(e.target.value)}
                placeholder="Descrição da oficina"
                disabled={creating}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={creating}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateTenant}
                disabled={creating || !newTenantName.trim()}
              >
                {creating ? 'Criando...' : 'Criar Oficina'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenantSelector;