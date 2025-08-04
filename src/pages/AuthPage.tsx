import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wrench, Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
interface AuthPageProps {
  onAuthSuccess: () => void;
}
export const AuthPage: React.FC<AuthPageProps> = ({
  onAuthSuccess
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const {
    toast
  } = useToast();
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    console.log('Tentando fazer login na AuthPage:', { email });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      console.log('Resultado da autenticação:', { data, error });
      
      if (error) {
        console.error('Erro específico:', error.message, error);
        throw error;
      }
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao OnliOficina"
      });
      onAuthSuccess();
    } catch (error: any) {
      console.error('Erro capturado no login:', error);
      toast({
        title: "Erro no login",
        description: error.message || "Email ou senha incorretos.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
      return;
    }
    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Conta criada com sucesso!",
        description: "Você já pode fazer login."
      });
      setActiveTab('login');
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Erro ao criar conta.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-md">
        <Card className="bg-card/95 backdrop-blur-sm shadow-custom-lg border-border/50">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
              <Wrench className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">OnliOficina</CardTitle>
              <CardDescription className="text-muted-foreground">
                Sistema de Gestão para Oficina Mecânica
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4 mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input id="email" type="email" placeholder="Digite seu email" value={email} onChange={e => setEmail(e.target.value)} className="h-12" disabled={isLoading} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Senha
                    </Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} placeholder="Digite sua senha" value={password} onChange={e => setPassword(e.target.value)} className="h-12 pr-12" disabled={isLoading} />
                      <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary-hover text-primary-foreground" disabled={isLoading}>
                    {isLoading ? <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Entrando...
                      </> : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4 mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input id="signup-email" type="email" placeholder="Digite seu email" value={email} onChange={e => setEmail(e.target.value)} className="h-12" disabled={isLoading} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-foreground flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Senha
                    </Label>
                    <div className="relative">
                      <Input id="signup-password" type={showPassword ? "text" : "password"} placeholder="Digite sua senha" value={password} onChange={e => setPassword(e.target.value)} className="h-12 pr-12" disabled={isLoading} />
                      <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-foreground flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Confirmar Senha
                    </Label>
                    <Input id="confirm-password" type={showPassword ? "text" : "password"} placeholder="Confirme sua senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="h-12" disabled={isLoading} />
                  </div>
                  
                  <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary-hover text-primary-foreground" disabled={isLoading}>
                    {isLoading ? <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Criando conta...
                      </> : 'Criar Conta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                <strong>Usuário admin:</strong> alfreire@admin.com<br />
                <strong>Senha:</strong> *M3a74g20M
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};