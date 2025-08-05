import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Mail, Shield, UserCheck, UserX, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CompanyUser {
  id: string;
  email: string;
  role: 'admin' | 'gerente' | 'funcionario';
  status: 'ativo' | 'inativo';
  created_at: string;
  nome_completo?: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: 'admin' | 'gerente' | 'funcionario';
  status: string;
  created_at: string;
}

const usuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['admin', 'gerente', 'funcionario'], {
    required_error: 'Selecione um cargo'
  })
});

type UsuarioFormData = z.infer<typeof usuarioSchema>;

const roleLabels = {
  admin: 'Administrador',
  gerente: 'Gerente',
  funcionario: 'Funcionário'
};

const statusLabels = {
  ativo: 'Ativo',
  inativo: 'Inativo'
};

const statusColors = {
  ativo: 'bg-green-100 text-green-800',
  inativo: 'bg-red-100 text-red-800'
};

const roleColors = {
  admin: 'bg-purple-100 text-purple-800',
  gerente: 'bg-blue-100 text-blue-800',
  funcionario: 'bg-gray-100 text-gray-800'
};

export function GerenciamentoUsuarios() {
  const [usuarios, setUsuarios] = useState<CompanyUser[]>([]);
  const [convites, setConvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('funcionario');
  const { toast } = useToast();

  const form = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      email: '',
      role: 'funcionario'
    }
  });

  useEffect(() => {
    loadUserRole();
    loadUsuarios();
    loadConvites();
  }, []);

  const loadUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Por enquanto, assumir que o primeiro usuário é admin
        setUserRole('admin');
      }
    } catch (error) {
      console.error('Erro ao carregar role do usuário:', error);
    }
  };

  const loadUsuarios = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Simular carregamento de usuários da empresa
      const mockUsers: CompanyUser[] = [
        {
          id: user.id,
          email: user.email || '',
          role: 'admin',
          status: 'ativo',
          created_at: new Date().toISOString(),
          nome_completo: user.user_metadata?.nome_completo
        }
      ];
      
      setUsuarios(mockUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar usuários',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadConvites = async () => {
    try {
      // Simular carregamento de convites pendentes
      setConvites([]);
    } catch (error) {
      console.error('Erro ao carregar convites:', error);
    }
  };

  const handleCreateUser = async (data: UsuarioFormData) => {
    setCreating(true);
    try {
      // Simular envio de convite
      const newInvite: PendingInvite = {
        id: Date.now().toString(),
        email: data.email,
        role: data.role,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      
      setConvites(prev => [...prev, newInvite]);
      
      toast({
        title: 'Convite enviado!',
        description: `Convite enviado para ${data.email}. O usuário receberá um email para aceitar o convite.`
      });
      
      form.reset();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao enviar convite',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: 'ativo' | 'inativo') => {
    try {
      // Simular alteração de status
      setUsuarios(prev => prev.map(u => 
        u.id === userId ? { ...u, status: newStatus } : u
      ));

      toast({
        title: 'Status atualizado',
        description: `Status do usuário atualizado para ${statusLabels[newStatus]}`
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status do usuário',
        variant: 'destructive'
      });
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      // Simular cancelamento de convite
      setConvites(prev => prev.filter(invite => invite.id !== inviteId));

      toast({
        title: 'Convite cancelado',
        description: 'O convite foi cancelado com sucesso'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao cancelar convite',
        variant: 'destructive'
      });
    }
  };

  const isAdmin = () => userRole === 'admin';

  if (!isAdmin()) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Acesso Restrito
          </h3>
          <p className="text-muted-foreground">
            Apenas administradores podem gerenciar usuários.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gerenciamento de Usuários</h2>
          <p className="text-muted-foreground">
            Gerencie os usuários da sua empresa
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Convidar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar Novo Usuário</DialogTitle>
              <DialogDescription>
                Envie um convite para um novo usuário se juntar à sua empresa
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={form.handleSubmit(handleCreateUser)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@email.com"
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Cargo</Label>
                <Select
                  value={form.watch('role')}
                  onValueChange={(value) => form.setValue('role', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="funcionario">Funcionário</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.role && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.role.message}
                  </p>
                )}
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Enviando...' : 'Enviar Convite'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Convites Pendentes */}
      {convites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Convites Pendentes
            </CardTitle>
            <CardDescription>
              Convites enviados aguardando aceitação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {convites.map((convite) => (
                <div key={convite.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{convite.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={roleColors[convite.role]}>
                          {roleLabels[convite.role]}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Enviado em {new Date(convite.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelInvite(convite.id)}
                  >
                    Cancelar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Usuários da Empresa
          </CardTitle>
          <CardDescription>
            {usuarios.length} usuário(s) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando usuários...</p>
            </div>
          ) : usuarios.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum usuário encontrado
              </h3>
              <p className="text-muted-foreground">
                Comece convidando seu primeiro usuário.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {usuarios.map((usuario) => (
                <div key={usuario.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {usuario.nome_completo || usuario.email || 'Nome não informado'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {usuario.email}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={roleColors[usuario.role]}>
                          {roleLabels[usuario.role]}
                        </Badge>
                        <Badge className={statusColors[usuario.status]}>
                          {statusLabels[usuario.status]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {usuario.status === 'ativo' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateUserStatus(usuario.id, 'inativo')}
                      >
                        <UserX className="w-4 h-4 mr-1" />
                        Desativar
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateUserStatus(usuario.id, 'ativo')}
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        Ativar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default GerenciamentoUsuarios;