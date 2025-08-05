import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Search, AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Peca = Tables<"pecas"> & {
  categoria: Tables<"categorias_pecas"> | null;
  fornecedor: Tables<"fornecedores"> | null;
};

type CategoriaPeca = Tables<"categorias_pecas">;
type Fornecedor = Tables<"fornecedores">;

const pecaSchema = z.object({
  codigo: z.string().min(1, "Código é obrigatório"),
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  categoria_id: z.string().min(1, "Categoria é obrigatória"),
  fornecedor_id: z.string().optional(),
  preco_custo: z.string().min(1, "Preço de custo é obrigatório"),
  preco_venda: z.string().min(1, "Preço de venda é obrigatório"),
  quantidade_atual: z.string().min(0, "Quantidade deve ser positiva"),
  quantidade_minima: z.string().min(0, "Quantidade mínima deve ser positiva"),
  quantidade_maxima: z.string().min(0, "Quantidade máxima deve ser positiva"),
  localizacao: z.string().optional(),
  codigo_fabricante: z.string().optional(),
  codigo_original: z.string().optional(),
  observacoes: z.string().optional(),
});

type PecaFormData = z.infer<typeof pecaSchema>;

export function PecasList() {
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [categorias, setCategorias] = useState<CategoriaPeca[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPeca, setEditingPeca] = useState<Peca | null>(null);

  const form = useForm<PecaFormData>({
    resolver: zodResolver(pecaSchema),
    defaultValues: {
      codigo: "",
      nome: "",
      descricao: "",
      categoria_id: "",
      fornecedor_id: "",
      preco_custo: "0",
      preco_venda: "0",
      quantidade_atual: "0",
      quantidade_minima: "0",
      quantidade_maxima: "0",
      localizacao: "",
      codigo_fabricante: "",
      codigo_original: "",
      observacoes: "",
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pecasResult, categoriasResult, fornecedoresResult] = await Promise.all([
        supabase
          .from("pecas")
          .select(`
            *,
            categoria:categorias_pecas(*),
            fornecedor:fornecedores(*)
          `)
          .order("nome"),
        supabase
          .from("categorias_pecas")
          .select("*")
          .order("nome"),
        supabase
          .from("fornecedores")
          .select("*")
          .order("nome")
      ]);

      if (pecasResult.error) throw pecasResult.error;
      if (categoriasResult.error) throw categoriasResult.error;
      if (fornecedoresResult.error) throw fornecedoresResult.error;

      setPecas(pecasResult.data || []);
      setCategorias(categoriasResult.data || []);
      setFornecedores(fornecedoresResult.data || []);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: PecaFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const pecaData = {
        codigo: data.codigo,
        nome: data.nome,
        descricao: data.descricao || null,
        categoria_id: data.categoria_id,
        fornecedor_id: data.fornecedor_id || null,
        preco_custo: parseFloat(data.preco_custo),
        preco_venda: parseFloat(data.preco_venda),
        quantidade_atual: parseInt(data.quantidade_atual),
        quantidade_minima: parseInt(data.quantidade_minima),
        quantidade_maxima: parseInt(data.quantidade_maxima),
        localizacao: data.localizacao || null,
        codigo_fabricante: data.codigo_fabricante || null,
        codigo_original: data.codigo_original || null,
        observacoes: data.observacoes || null,
      };

      if (editingPeca) {
        const { error } = await supabase
          .from("pecas")
          .update({
            ...pecaData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingPeca.id);

        if (error) throw error;
        toast.success("Peça atualizada com sucesso!");
      } else {
        const { error } = await supabase
          .from("pecas")
          .insert({
            ...pecaData,
            user_id: user.id,
          });

        if (error) throw error;
        toast.success("Peça criada com sucesso!");
      }

      setIsDialogOpen(false);
      setEditingPeca(null);
      form.reset();
      fetchData();
    } catch (error) {
      console.error("Erro ao salvar peça:", error);
      toast.error("Erro ao salvar peça");
    }
  };

  const handleEdit = (peca: Peca) => {
    setEditingPeca(peca);
    form.reset({
      codigo: peca.codigo,
      nome: peca.nome,
      descricao: peca.descricao || "",
      categoria_id: peca.categoria_id,
      fornecedor_id: peca.fornecedor_id || "",
      preco_custo: peca.preco_custo.toString(),
      preco_venda: peca.preco_venda.toString(),
      quantidade_atual: peca.quantidade_atual.toString(),
      quantidade_minima: peca.quantidade_minima.toString(),
      quantidade_maxima: peca.quantidade_maxima.toString(),
      localizacao: peca.localizacao || "",
      codigo_fabricante: peca.codigo_fabricante || "",
      codigo_original: peca.codigo_original || "",
      observacoes: peca.observacoes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta peça?")) return;

    try {
      const { error } = await supabase
        .from("pecas")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Peça excluída com sucesso!");
      fetchData();
    } catch (error) {
      console.error("Erro ao excluir peça:", error);
      toast.error("Erro ao excluir peça");
    }
  };

  const filteredPecas = pecas.filter((peca) =>
    peca.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    peca.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    peca.categoria?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNewPeca = () => {
    setEditingPeca(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const getEstoqueStatus = (peca: Peca): { status: string; color: "destructive" | "secondary" | "default" } => {
    if (peca.quantidade_atual <= peca.quantidade_minima) {
      return { status: "baixo", color: "destructive" };
    }
    if (peca.quantidade_atual >= peca.quantidade_maxima) {
      return { status: "alto", color: "secondary" };
    }
    return { status: "normal", color: "default" };
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Peças</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewPeca}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Peça
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPeca ? "Editar Peça" : "Nova Peça"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="codigo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código *</FormLabel>
                        <FormControl>
                          <Input placeholder="Código da peça" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da peça" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descrição da peça" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoria_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categorias.map((categoria) => (
                              <SelectItem key={categoria.id} value={categoria.id}>
                                {categoria.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fornecedor_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fornecedor</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um fornecedor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Nenhum</SelectItem>
                            {fornecedores.map((fornecedor) => (
                              <SelectItem key={fornecedor.id} value={fornecedor.id}>
                                {fornecedor.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="preco_custo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço de Custo *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="preco_venda"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço de Venda *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="quantidade_atual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade Atual</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantidade_minima"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade Mínima</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantidade_maxima"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade Máxima</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="localizacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Localização</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Prateleira A1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="codigo_fabricante"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código Fabricante</FormLabel>
                        <FormControl>
                          <Input placeholder="Código do fabricante" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="codigo_original"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código Original</FormLabel>
                        <FormControl>
                          <Input placeholder="Código original" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Observações sobre a peça" {...field} />
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
                    {editingPeca ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Peças</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, código ou categoria..."
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
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Preço Venda</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPecas.map((peca) => {
                const estoqueStatus = getEstoqueStatus(peca);
                return (
                  <TableRow key={peca.id}>
                    <TableCell className="font-medium">{peca.codigo}</TableCell>
                    <TableCell>{peca.nome}</TableCell>
                    <TableCell>{peca.categoria?.nome || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{peca.quantidade_atual}</span>
                        {estoqueStatus.status === "baixo" && (
                          <Badge variant={estoqueStatus.color} className="flex items-center space-x-1">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Baixo</span>
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>R$ {peca.preco_venda.toFixed(2)}</TableCell>
                    <TableCell>{peca.fornecedor?.nome || "-"}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(peca)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(peca.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filteredPecas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma peça encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}