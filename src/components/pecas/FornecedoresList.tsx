import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Fornecedor = Tables<"fornecedores">;

const fornecedorSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
  contato_responsavel: z.string().optional(),
  observacoes: z.string().optional(),
});

type FornecedorFormData = z.infer<typeof fornecedorSchema>;

export function FornecedoresList() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);

  const form = useForm<FornecedorFormData>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: {
      nome: "",
      cnpj: "",
      telefone: "",
      email: "",
      endereco: "",
      cidade: "",
      estado: "",
      cep: "",
      contato_responsavel: "",
      observacoes: "",
    },
  });

  useEffect(() => {
    fetchFornecedores();
  }, []);

  const fetchFornecedores = async () => {
    try {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("*")
        .order("nome");

      if (error) throw error;
      setFornecedores(data || []);
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
      toast.error("Erro ao carregar fornecedores");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FornecedorFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const fornecedorData = {
        ...data,
        email: data.email || null,
      };

      if (editingFornecedor) {
        const { error } = await supabase
          .from("fornecedores")
          .update({
            ...fornecedorData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingFornecedor.id);

        if (error) throw error;
        toast.success("Fornecedor atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("fornecedores")
          .insert({
            ...fornecedorData,
            user_id: user.id,
          });

        if (error) throw error;
        toast.success("Fornecedor criado com sucesso!");
      }

      setIsDialogOpen(false);
      setEditingFornecedor(null);
      form.reset();
      fetchFornecedores();
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error);
      toast.error("Erro ao salvar fornecedor");
    }
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setEditingFornecedor(fornecedor);
    form.reset({
      nome: fornecedor.nome,
      cnpj: fornecedor.cnpj || "",
      telefone: fornecedor.telefone || "",
      email: fornecedor.email || "",
      endereco: fornecedor.endereco || "",
      cidade: fornecedor.cidade || "",
      estado: fornecedor.estado || "",
      cep: fornecedor.cep || "",
      contato_responsavel: fornecedor.contato_responsavel || "",
      observacoes: fornecedor.observacoes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este fornecedor?")) return;

    try {
      const { error } = await supabase
        .from("fornecedores")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Fornecedor excluído com sucesso!");
      fetchFornecedores();
    } catch (error) {
      console.error("Erro ao excluir fornecedor:", error);
      toast.error("Erro ao excluir fornecedor");
    }
  };

  const filteredFornecedores = fornecedores.filter((fornecedor) =>
    fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fornecedor.cnpj?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fornecedor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNewFornecedor = () => {
    setEditingFornecedor(null);
    form.reset();
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Fornecedores</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewFornecedor}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingFornecedor ? "Editar Fornecedor" : "Novo Fornecedor"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do fornecedor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ</FormLabel>
                        <FormControl>
                          <Input placeholder="CNPJ" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="Telefone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Endereço completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="cidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder="Cidade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input placeholder="Estado" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input placeholder="CEP" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="contato_responsavel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contato Responsável</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do contato responsável" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Observações sobre o fornecedor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingFornecedor ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Fornecedores</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CNPJ ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFornecedores.map((fornecedor) => (
                <TableRow key={fornecedor.id}>
                  <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                  <TableCell>{fornecedor.cnpj || "-"}</TableCell>
                  <TableCell>{fornecedor.telefone || "-"}</TableCell>
                  <TableCell>{fornecedor.email || "-"}</TableCell>
                  <TableCell>{fornecedor.cidade || "-"}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(fornecedor)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(fornecedor.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredFornecedores.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum fornecedor encontrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}