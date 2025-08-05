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

type CategoriaPeca = Tables<"categorias_pecas">;

const categoriaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  codigo: z.string().optional(),
  descricao: z.string().optional(),
});

type CategoriaFormData = z.infer<typeof categoriaSchema>;

export function CategoriasPecasList() {
  const [categorias, setCategorias] = useState<CategoriaPeca[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaPeca | null>(null);

  const form = useForm<CategoriaFormData>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nome: "",
      codigo: "",
      descricao: "",
    },
  });

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from("categorias_pecas")
        .select("*")
        .order("nome");

      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      toast.error("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CategoriaFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      if (editingCategoria) {
        const { error } = await supabase
          .from("categorias_pecas")
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingCategoria.id);

        if (error) throw error;
        toast.success("Categoria atualizada com sucesso!");
      } else {
        const { error } = await supabase
          .from("categorias_pecas")
          .insert({
            ...data,
            user_id: user.id,
          });

        if (error) throw error;
        toast.success("Categoria criada com sucesso!");
      }

      setIsDialogOpen(false);
      setEditingCategoria(null);
      form.reset();
      fetchCategorias();
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
      toast.error("Erro ao salvar categoria");
    }
  };

  const handleEdit = (categoria: CategoriaPeca) => {
    setEditingCategoria(categoria);
    form.reset({
      nome: categoria.nome,
      codigo: categoria.codigo || "",
      descricao: categoria.descricao || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;

    try {
      const { error } = await supabase
        .from("categorias_pecas")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Categoria excluída com sucesso!");
      fetchCategorias();
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      toast.error("Erro ao excluir categoria");
    }
  };

  const filteredCategorias = categorias.filter((categoria) =>
    categoria.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    categoria.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNewCategoria = () => {
    setEditingCategoria(null);
    form.reset();
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Categorias de Peças</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewCategoria}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategoria ? "Editar Categoria" : "Nova Categoria"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da categoria" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código</FormLabel>
                      <FormControl>
                        <Input placeholder="Código da categoria" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descrição da categoria" {...field} />
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
                    {editingCategoria ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Categorias</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou código..."
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
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategorias.map((categoria) => (
                <TableRow key={categoria.id}>
                  <TableCell className="font-medium">{categoria.nome}</TableCell>
                  <TableCell>{categoria.codigo || "-"}</TableCell>
                  <TableCell>{categoria.descricao || "-"}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(categoria)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(categoria.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredCategorias.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma categoria encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}