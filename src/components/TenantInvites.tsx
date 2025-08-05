import React, { useState, useEffect } from 'react';
import { useTenantContext } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Mail, UserPlus, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { TenantInvite } from '@/hooks/useTenant';

const TenantInvites: React.FC = () => {
  const {
    createInvite,
    getPendingInvites,
    isAdmin,
    isManager,
    currentTenant
  } = useTenantContext();

  const [invites, setInvites] = useState<TenantInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Form state
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'gerente' | 'funcionario'>('funcionario');

  const canManageInvites = isAdmin() || isManager();

  useEffect(() => {
    if (canManageInvites) {
      loadInvites();
    }
  }, [canManageInvites]);

  const loadInvites = async () => {
    if (!canManageInvites) return;
    
    setLoading(true);
    try {
      const data = await getPendingInvites();
      setInvites(data);
    } catch (error) {
      toast.error('Erro ao carregar convites');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async () => {
    if (!email.trim()) {
      toast.error('Email é obrigatório');
      return;
    }

    if (!canManageInvites) {
      toast.error('Você não tem permissão para criar convites');
      return;
    }

    setCreating(true);
    try {
      await createInvite(email.trim(), role);
      setEmail('');
      setRole('funcionario');
      toast.success('Convite enviado com sucesso!');
      await loadInvites();
    } catch (error) {
      toast.error('Erro ao enviar convite');
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return (
          <Badge variant="outline" className="text-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'aceito':
        return (
          <Badge variant="outline" className="text-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aceito
          </Badge>
        );
      case 'expirado':
      case 'cancelado':
        return (
          <Badge variant="outline" className="text-red-600">
            <XCircle className="w-3 h-3 mr-1" />
            {status === 'expirado' ? 'Expirado' : 'Cancelado'}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      gerente: 'bg-blue-100 text-blue-800',
      funcionario: 'bg-green-100 text-green-800'
    };

    return (
      <Badge className={colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {role === 'admin' ? 'Administrador' : 
         role === 'gerente' ? 'Gerente' : 'Funcionário'}
      </Badge>
    );
  };

  if (!canManageInvites) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <UserPlus className="mx-auto h-12 w-12 mb-4" />
            <p>Você não tem permissão para gerenciar convites.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Formulário para criar convite */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5" />
            Convidar Usuário
          </CardTitle>
          <CardDescription>
            Convide novos usuários para sua oficina
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@exemplo.com"
                disabled={creating}
              />
            </div>
            
            <div>
              <Label htmlFor="role">Função</Label>
              <Select value={role} onValueChange={(value: any) => setRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="funcionario">Funcionário</SelectItem>
                  <SelectItem value="gerente">Gerente</SelectItem>
                  {isAdmin() && (
                    <SelectItem value="admin">Administrador</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button
                onClick={handleCreateInvite}
                disabled={creating || !email.trim()}
                className="w-full"
              >
                {creating ? 'Enviando...' : 'Enviar Convite'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de convites */}
      <Card>
        <CardHeader>
          <CardTitle>Convites Enviados</CardTitle>
          <CardDescription>
            Gerencie os convites enviados para sua oficina
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando convites...</p>
            </div>
          ) : invites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="mx-auto h-12 w-12 mb-4" />
              <p>Nenhum convite enviado ainda.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead>Expira em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium">{invite.email}</TableCell>
                    <TableCell>{getRoleBadge(invite.role)}</TableCell>
                    <TableCell>{getStatusBadge(invite.status)}</TableCell>
                    <TableCell>
                      {new Date(invite.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantInvites;