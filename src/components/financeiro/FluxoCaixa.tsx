import { useState, useEffect, useCallback } from "react";
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
import { Plus, Edit, Trash2, Search, DollarSign, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

import { DateRange } from "react-day-picker";

type FluxoCaixa = Tables<"fluxo_caixa">;

const fluxoCaixaSchema = z.object({
  tipo: z.enum(["entrada", "saida"], {
    required_error: "Tipo é obrigatório",
  }),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  valor: z.string().min(1, "Valor é obrigatório"),
  data_operacao: z.string().min(1, "Data da operação é obrigatória"),
  observacoes: z.string().optional(),
});

type FluxoCaixaFormData = z.infer<typeof fluxoCaixaSchema>;

export function FluxoCaixa() {
  const [movimentos, setMovimentos] = useState<FluxoCaixa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("todas");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMovimento, setEditingMovimento] = useState<FluxoCaixa | null>(null);

  const form = useForm<FluxoCaixaFormData>({
    resolver: zodResolver(fluxoCaixaSchema),
    defaultValues: {
      tipo: "entrada",
      categoria: "",
      descricao: "",
      valor: "",
      data_operacao: new Date().toISOString().split('T')[0],
      observacoes: "",
    },
  });

  const categorias = {
    entrada: [
      "Vendas",
      "Serviços",
      "Recebimento de Clientes",
      "Empréstimos",
      "Investimentos",
      "Outros Recebimentos",
    ],
    saida: [
      "Compra de Peças",
      "Salários",
      "Aluguel",
      "Energia Elétrica",
      "Telefone/Internet",
      "Combustível",
      "Manutenção",
      "Impostos",
      "Fornecedores",
      "Marketing",
      "Outros Gastos",
    ],
  };

  const fetchMovimentos = useCallback(async () => {
    try {
      let query = supabase
        .from("fluxo_caixa")
        .select("*")
        .order("data_operacao", { ascending: false });

      if (dateRange?.from) {
        query = query.gte("data_operacao", format(dateRange.from, "yyyy-MM-dd"));
      }
      if (dateRange?.to) {
        query = query.lte("data_operacao", format(dateRange.to, "yyyy-MM-dd"));
      }

      const { data, error } = await query;

      if (error) throw error;
      setMovimentos(data || []);
    } catch (error) {
      console.error("Erro ao buscar movimentos:", error);
      toast.error("Erro ao carregar movimentos do fluxo de caixa");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchMovimentos();
  }, [fetchMovimentos]);

  const onSubmit = async (data: FluxoCaixaFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const movimentoData = {
        tipo: data.tipo,
        categoria: data.categoria,
        descricao: data.descricao,
        valor: parseFloat(data.valor),
        data_operacao: data.data_operacao,
        observacoes: data.observacoes || null,
      };

      if (editingMovimento) {
        const { error } = await supabase
          .from("fluxo_caixa")
          .update({
            ...movimentoData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingMovimento.id);

        if (error) throw error;
        toast.success("Movimento atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("fluxo_caixa")
          .insert({
            ...movimentoData,
            user_id: user.id,
          });

        if (error) throw error;
        toast.success("Movimento registrado com sucesso!");
      }

      setIsDialogOpen(false);
      setEditingMovimento(null);
      form.reset();
      fetchMovimentos();
    } catch (error) {
      console.error("Erro ao salvar movimento:", error);
      toast.error("Erro ao salvar movimento");
    }
  };

  const handleEdit = (movimento: FluxoCaixa) => {
    setEditingMovimento(movimento);
    form.reset({
      tipo: movimento.tipo,
      categoria: movimento.categoria,
      descricao: movimento.descricao,
      valor: movimento.valor.toString(),
      data_operacao: movimento.data_operacao,
      observacoes: movimento.observacoes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este movimento?")) return;

    try {
      const { error } = await supabase
        .from("fluxo_caixa")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Movimento excluído com sucesso!");
      fetchMovimentos();
    } catch (error) {
      console.error("Erro ao excluir movimento:", error);
      toast.error("Erro ao excluir movimento");
    }
  };

  const filteredMovimentos = movimentos.filter((movimento) => {
    const matchesSearch = movimento.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movimento.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = tipoFilter === "todos" || movimento.tipo === tipoFilter;
    const matchesCategoria = categoriaFilter === "todas" || movimento.categoria === categoriaFilter;
    
    return matchesSearch && matchesTipo && matchesCategoria;
  });

  const handleNewMovimento = () => {
    setEditingMovimento(null);
    form.reset({
      tipo: "entrada",
      categoria: "",
      descricao: "",
      valor: "",
      data_operacao: new Date().toISOString().split('T')[0],
      observacoes: "",
    });
    setIsDialogOpen(true);
  };

  const calcularTotais = () => {
    const entradas = filteredMovimentos
      .filter(m => m.tipo === "entrada")
      .reduce((sum, m) => sum + m.valor, 0);
    
    const saidas = filteredMovimentos
      .filter(m => m.tipo === "saida")
      .reduce((sum, m) => sum + m.valor, 0);
    
    return { entradas, saidas, saldo: entradas - saidas };
  };

  const totais = calcularTotais();

  const handlePreviousMonth = () => {
    if (dateRange?.from) {
      const newDate = subMonths(dateRange.from, 1);
      setDateRange({
        from: startOfMonth(newDate),
        to: endOfMonth(newDate),
      });
    }
  };

  const handleNextMonth = () => {
    if (dateRange?.from) {
      const newDate = addMonths(dateRange.from, 1);
      setDateRange({
        from: startOfMonth(newDate),
        to: endOfMonth(newDate),
      });
    }
  };

  const handleCurrentMonth = () => {
    setDateRange({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    });
  };

  const todasCategorias = [...categorias.entrada, ...categorias.saida];

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Fluxo de Caixa</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewMovimento}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Movimento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMovimento ? "Editar Movimento" : "Novo Movimento"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="entrada">Entrada</SelectItem>
                            <SelectItem value="saida">Saída</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="categoria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(form.watch("tipo") === "entrada" ? categorias.entrada : categorias.saida).map((categoria) => (
                              <SelectItem key={categoria} value={categoria}>
                                {categoria}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                      <FormLabel>Descrição *</FormLabel>
                      <FormControl>
                        <Input placeholder="Descrição do movimento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="valor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="data_operacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data da Operação *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                        <Textarea placeholder="Observações sobre o movimento" {...field} />
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
                    {editingMovimento ? "Atualizar" : "Registrar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Controles de Período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Período</span>
          </CardTitle>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={handlePreviousMonth}>
              Mês Anterior
            </Button>
            <Button variant="outline" onClick={handleCurrentMonth}>
              Mês Atual
            </Button>
            <Button variant="outline" onClick={handleNextMonth}>
              Próximo Mês
            </Button>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {dateRange?.from && dateRange?.to
                  ? `${format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}`
                  : "Selecione um período"}
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totais.entradas.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {totais.saidas.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo do Período</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              totais.saldo >= 0 ? "text-green-600" : "text-red-600"
            }`}>
              R$ {totais.saldo.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <div className="flex space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição ou categoria..."
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
              </SelectContent>
            </Select>
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {todasCategorias.map((categoria) => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovimentos.map((movimento) => (
                <TableRow key={movimento.id}>
                  <TableCell>
                    {format(new Date(movimento.data_operacao), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={movimento.tipo === "entrada" ? "default" : "destructive"}>
                      {movimento.tipo === "entrada" ? "Entrada" : "Saída"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {movimento.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{movimento.descricao}</div>
                      {movimento.observacoes && (
                        <div className="text-sm text-muted-foreground">
                          {movimento.observacoes}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`flex items-center space-x-2 ${
                      movimento.tipo === "entrada" ? "text-green-600" : "text-red-600"
                    }`}>
                      {movimento.tipo === "entrada" ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span>R$ {movimento.valor.toFixed(2)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(movimento)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(movimento.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredMovimentos.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum movimento encontrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}