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
import { Plus, Search, TrendingUp, TrendingDown, RotateCcw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type MovimentacaoEstoque = Tables<"movimentacoes_estoque"> & {
  peca: Tables<"pecas"> | null;
};

type Peca = Tables<"pecas">;

const movimentacaoSchema = z.object({
  peca_id: z.string().min(1, "Peça é obrigatória"),
  tipo_movimentacao: z.enum(["entrada", "saida", "ajuste"], {
    required_error: "Tipo de movimentação é obrigatório",
  }),
  quantidade: z.string().min(1, "Quantidade é obrigatória"),
  valor_unitario: z.string().optional(),
  motivo: z.string().min(1, "Motivo é obrigatório"),
  observacoes: z.string().optional(),
});

type MovimentacaoFormData = z.infer<typeof movimentacaoSchema>;

export function MovimentacoesEstoque() {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tipoFilter, setTipoFilter] = useState<string>("todos");

  const form = useForm<MovimentacaoFormData>({
    resolver: zodResolver(movimentacaoSchema),
    defaultValues: {
      peca_id: "",
      tipo_movimentacao: "entrada",
      quantidade: "",
      valor_unitario: "",
      motivo: "",
      observacoes: "",
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [movimentacoesResult, pecasResult] = await Promise.all([
        supabase
          .from("movimentacoes_estoque")
          .select(`
            *,
            peca:pecas(*)
          `)
          .order("created_at", { ascending: false }),
        supabase
          .from("pecas")
          .select("*")
          .order("nome")
      ]);

      if (movimentacoesResult.error) throw movimentacoesResult.error;
      if (pecasResult.error) throw pecasResult.error;

      setMovimentacoes(movimentacoesResult.data || []);
      setPecas(pecasResult.data || []);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: MovimentacaoFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const quantidade = parseInt(data.quantidade);
      const valorUnitario = data.valor_unitario ? parseFloat(data.valor_unitario) : null;

      // Buscar a peça atual para verificar estoque
      const { data: pecaAtual, error: pecaError } = await supabase
        .from("pecas")
        .select("quantidade_atual")
        .eq("id", data.peca_id)
        .single();

      if (pecaError) throw pecaError;

      let novaQuantidade = pecaAtual.quantidade_atual;
      
      if (data.tipo_movimentacao === "entrada" || data.tipo_movimentacao === "ajuste") {
        if (data.tipo_movimentacao === "ajuste") {
          novaQuantidade = quantidade;
        } else {
          novaQuantidade += quantidade;
        }
      } else if (data.tipo_movimentacao === "saida") {
        if (quantidade > pecaAtual.quantidade_atual) {
          toast.error("Quantidade insuficiente em estoque");
          return;
        }
        novaQuantidade -= quantidade;
      }

      // Inserir movimentação
      const { error: movError } = await supabase
        .from("movimentacoes_estoque")
        .insert({
          peca_id: data.peca_id,
          tipo_movimentacao: data.tipo_movimentacao,
          quantidade: quantidade,
          valor_unitario: valorUnitario,
          motivo: data.motivo,
          observacoes: data.observacoes || null,
          user_id: user.id,
        });

      if (movError) throw movError;

      // Atualizar quantidade da peça
      const { error: updateError } = await supabase
        .from("pecas")
        .update({ 
          quantidade_atual: novaQuantidade,
          updated_at: new Date().toISOString()
        })
        .eq("id", data.peca_id);

      if (updateError) throw updateError;

      toast.success("Movimentação registrada com sucesso!");
      setIsDialogOpen(false);
      form.reset();
      fetchData();
    } catch (error) {
      console.error("Erro ao registrar movimentação:", error);
      toast.error("Erro ao registrar movimentação");
    }
  };

  const filteredMovimentacoes = movimentacoes.filter((mov) => {
    const matchesSearch = mov.peca?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mov.peca?.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mov.motivo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = tipoFilter === "todos" || mov.tipo_movimentacao === tipoFilter;
    
    return matchesSearch && matchesFilter;
  });

  const handleNewMovimentacao = () => {
    form.reset();
    setIsDialogOpen(true);
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "entrada":
        return <TrendingUp className="h-4 w-4" />;
      case "saida":
        return <TrendingDown className="h-4 w-4" />;
      case "ajuste":
        return <RotateCcw className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case "entrada":
        return "default";
      case "saida":
        return "destructive";
      case "ajuste":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Movimentações de Estoque</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewMovimentacao}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Movimentação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Movimentação de Estoque</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="peca_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peça *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma peça" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {pecas.map((peca) => (
                            <SelectItem key={peca.id} value={peca.id}>
                              {peca.codigo} - {peca.nome} (Estoque: {peca.quantidade_atual})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tipo_movimentacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Movimentação *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="entrada">Entrada</SelectItem>
                            <SelectItem value="saida">Saída</SelectItem>
                            <SelectItem value="ajuste">Ajuste</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="valor_unitario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Unitário</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="motivo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Compra, Venda, Correção de estoque" {...field} />
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
                        <Textarea placeholder="Observações adicionais" {...field} />
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
                    Registrar Movimentação
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <div className="flex space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por peça, código ou motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
                <SelectItem value="ajuste">Ajuste</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Peça</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Valor Unit.</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovimentacoes.map((movimentacao) => (
                <TableRow key={movimentacao.id}>
                  <TableCell>
                    {format(new Date(movimentacao.created_at), "dd/MM/yyyy HH:mm", {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{movimentacao.peca?.nome}</div>
                      <div className="text-sm text-muted-foreground">
                        {movimentacao.peca?.codigo}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={getTipoBadgeVariant(movimentacao.tipo_movimentacao) as any}
                      className="flex items-center space-x-1 w-fit"
                    >
                      {getTipoIcon(movimentacao.tipo_movimentacao)}
                      <span className="capitalize">{movimentacao.tipo_movimentacao}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {movimentacao.tipo_movimentacao === "saida" ? "-" : "+"}
                    {movimentacao.quantidade}
                  </TableCell>
                  <TableCell>
                    {movimentacao.valor_unitario 
                      ? `R$ ${movimentacao.valor_unitario.toFixed(2)}` 
                      : "-"
                    }
                  </TableCell>
                  <TableCell>{movimentacao.motivo}</TableCell>
                  <TableCell>{movimentacao.observacoes || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredMovimentacoes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma movimentação encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}