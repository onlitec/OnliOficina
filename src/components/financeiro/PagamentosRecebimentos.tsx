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
import { Plus, Edit, Trash2, Search, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type PagamentoRecebimento = Tables<"pagamentos_recebimentos"> & {
  contas_receber?: Tables<"contas_receber"> & {
    clientes?: Tables<"clientes">;
  };
  contas_pagar?: Tables<"contas_pagar"> & {
    fornecedores?: Tables<"fornecedores">;
  };
};

type ContaReceber = Tables<"contas_receber"> & {
  clientes?: Tables<"clientes">;
};

type ContaPagar = Tables<"contas_pagar"> & {
  fornecedores?: Tables<"fornecedores">;
};

const pagamentoRecebimentoSchema = z.object({
  tipo: z.enum(["recebimento", "pagamento"], {
    required_error: "Tipo é obrigatório",
  }),
  conta_receber_id: z.string().optional(),
  conta_pagar_id: z.string().optional(),
  valor: z.string().min(1, "Valor é obrigatório"),
  data_transacao: z.string().min(1, "Data da transação é obrigatória"),
  forma_pagamento: z.enum(["dinheiro", "cartao_credito", "cartao_debito", "pix", "transferencia", "cheque", "boleto"], {
    required_error: "Forma de pagamento é obrigatória",
  }),
  descricao: z.string().optional(),
  observacoes: z.string().optional(),
});

type PagamentoRecebimentoFormData = z.infer<typeof pagamentoRecebimentoSchema>;

export function PagamentosRecebimentos() {
  const [transacoes, setTransacoes] = useState<PagamentoRecebimento[]>([]);
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [formaPagamentoFilter, setFormaPagamentoFilter] = useState<string>("todas");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransacao, setEditingTransacao] = useState<PagamentoRecebimento | null>(null);

  const form = useForm<PagamentoRecebimentoFormData>({
    resolver: zodResolver(pagamentoRecebimentoSchema),
    defaultValues: {
      tipo: "recebimento",
      conta_receber_id: "",
      conta_pagar_id: "",
      valor: "",
      data_transacao: new Date().toISOString().split('T')[0],
      forma_pagamento: "dinheiro",
      descricao: "",
      observacoes: "",
    },
  });

  const formasPagamento = [
    { value: "dinheiro", label: "Dinheiro" },
    { value: "cartao_credito", label: "Cartão de Crédito" },
    { value: "cartao_debito", label: "Cartão de Débito" },
    { value: "pix", label: "PIX" },
    { value: "transferencia", label: "Transferência" },
    { value: "cheque", label: "Cheque" },
    { value: "boleto", label: "Boleto" },
  ];

  useEffect(() => {
    fetchTransacoes();
    fetchContasReceber();
    fetchContasPagar();
  }, []);

  const fetchTransacoes = async () => {
    try {
      const { data, error } = await supabase
        .from("pagamentos_recebimentos")
        .select(`
          *,
          contas_receber (
            id,
            descricao,
            valor,
            clientes (
              id,
              nome
            )
          ),
          contas_pagar (
            id,
            descricao,
            valor,
            fornecedores (
              id,
              nome
            )
          )
        `)
        .order("data_transacao", { ascending: false });

      if (error) throw error;
      setTransacoes(data || []);
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
      toast.error("Erro ao carregar transações");
    } finally {
      setLoading(false);
    }
  };

  const fetchContasReceber = async () => {
    try {
      const { data, error } = await supabase
        .from("contas_receber")
        .select(`
          *,
          clientes (
            id,
            nome
          )
        `)
        .eq("status", "pendente")
        .order("data_vencimento");

      if (error) throw error;
      setContasReceber(data || []);
    } catch (error) {
      console.error("Erro ao buscar contas a receber:", error);
      toast.error("Erro ao carregar contas a receber");
    }
  };

  const fetchContasPagar = async () => {
    try {
      const { data, error } = await supabase
        .from("contas_pagar")
        .select(`
          *,
          fornecedores (
            id,
            nome
          )
        `)
        .eq("status", "pendente")
        .order("data_vencimento");

      if (error) throw error;
      setContasPagar(data || []);
    } catch (error) {
      console.error("Erro ao buscar contas a pagar:", error);
      toast.error("Erro ao carregar contas a pagar");
    }
  };

  const onSubmit = async (data: PagamentoRecebimentoFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Validar se a conta foi selecionada baseada no tipo
      if (data.tipo === "recebimento" && !data.conta_receber_id) {
        toast.error("Selecione uma conta a receber");
        return;
      }
      if (data.tipo === "pagamento" && !data.conta_pagar_id) {
        toast.error("Selecione uma conta a pagar");
        return;
      }

      const transacaoData = {
        tipo: data.tipo,
        conta_receber_id: data.tipo === "recebimento" ? data.conta_receber_id : null,
        conta_pagar_id: data.tipo === "pagamento" ? data.conta_pagar_id : null,
        valor: parseFloat(data.valor),
        data_transacao: data.data_transacao,
        forma_pagamento: data.forma_pagamento,
        descricao: data.descricao || null,
        observacoes: data.observacoes || null,
      };

      if (editingTransacao) {
        const { error } = await supabase
          .from("pagamentos_recebimentos")
          .update({
            ...transacaoData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingTransacao.id);

        if (error) throw error;
        toast.success("Transação atualizada com sucesso!");
      } else {
        const { error } = await supabase
          .from("pagamentos_recebimentos")
          .insert({
            ...transacaoData,
            user_id: user.id,
          });

        if (error) throw error;

        // Atualizar status da conta relacionada
        if (data.tipo === "recebimento" && data.conta_receber_id) {
          await supabase
            .from("contas_receber")
            .update({
              status: "pago",
              data_recebimento: data.data_transacao,
              valor_recebido: parseFloat(data.valor),
              updated_at: new Date().toISOString(),
            })
            .eq("id", data.conta_receber_id);
        }

        if (data.tipo === "pagamento" && data.conta_pagar_id) {
          await supabase
            .from("contas_pagar")
            .update({
              status: "pago",
              data_pagamento: data.data_transacao,
              valor_pago: parseFloat(data.valor),
              updated_at: new Date().toISOString(),
            })
            .eq("id", data.conta_pagar_id);
        }

        toast.success("Transação registrada com sucesso!");
      }

      setIsDialogOpen(false);
      setEditingTransacao(null);
      form.reset();
      fetchTransacoes();
      fetchContasReceber();
      fetchContasPagar();
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      toast.error("Erro ao salvar transação");
    }
  };

  const handleEdit = (transacao: PagamentoRecebimento) => {
    setEditingTransacao(transacao);
    form.reset({
      tipo: transacao.tipo,
      conta_receber_id: transacao.conta_receber_id || "",
      conta_pagar_id: transacao.conta_pagar_id || "",
      valor: transacao.valor.toString(),
      data_transacao: transacao.data_transacao,
      forma_pagamento: transacao.forma_pagamento,
      descricao: transacao.descricao || "",
      observacoes: transacao.observacoes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return;

    try {
      const { error } = await supabase
        .from("pagamentos_recebimentos")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Transação excluída com sucesso!");
      fetchTransacoes();
    } catch (error) {
      console.error("Erro ao excluir transação:", error);
      toast.error("Erro ao excluir transação");
    }
  };

  const filteredTransacoes = transacoes.filter((transacao) => {
    const matchesSearch = transacao.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transacao.contas_receber?.clientes?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transacao.contas_pagar?.fornecedores?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transacao.contas_receber?.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transacao.contas_pagar?.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = tipoFilter === "todos" || transacao.tipo === tipoFilter;
    const matchesFormaPagamento = formaPagamentoFilter === "todas" || transacao.forma_pagamento === formaPagamentoFilter;
    
    return matchesSearch && matchesTipo && matchesFormaPagamento;
  });

  const handleNewTransacao = () => {
    setEditingTransacao(null);
    form.reset({
      tipo: "recebimento",
      conta_receber_id: "",
      conta_pagar_id: "",
      valor: "",
      data_transacao: new Date().toISOString().split('T')[0],
      forma_pagamento: "dinheiro",
      descricao: "",
      observacoes: "",
    });
    setIsDialogOpen(true);
  };

  const getFormaPagamentoLabel = (forma: string) => {
    const formaPagamento = formasPagamento.find(f => f.value === forma);
    return formaPagamento ? formaPagamento.label : forma;
  };

  const calcularTotais = () => {
    const recebimentos = filteredTransacoes
      .filter(t => t.tipo === "recebimento")
      .reduce((sum, t) => sum + t.valor, 0);
    
    const pagamentos = filteredTransacoes
      .filter(t => t.tipo === "pagamento")
      .reduce((sum, t) => sum + t.valor, 0);
    
    return { recebimentos, pagamentos, saldo: recebimentos - pagamentos };
  };

  const totais = calcularTotais();

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pagamentos e Recebimentos</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewTransacao}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTransacao ? "Editar Transação" : "Nova Transação"}
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
                            <SelectItem value="recebimento">Recebimento</SelectItem>
                            <SelectItem value="pagamento">Pagamento</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="forma_pagamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma de Pagamento *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a forma" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {formasPagamento.map((forma) => (
                              <SelectItem key={forma.value} value={forma.value}>
                                {forma.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {form.watch("tipo") === "recebimento" && (
                  <FormField
                    control={form.control}
                    name="conta_receber_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conta a Receber *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a conta a receber" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contasReceber.map((conta) => (
                              <SelectItem key={conta.id} value={conta.id}>
                                {conta.clientes?.nome} - {conta.descricao} (R$ {conta.valor.toFixed(2)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {form.watch("tipo") === "pagamento" && (
                  <FormField
                    control={form.control}
                    name="conta_pagar_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conta a Pagar *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a conta a pagar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contasPagar.map((conta) => (
                              <SelectItem key={conta.id} value={conta.id}>
                                {conta.fornecedores?.nome} - {conta.descricao} (R$ {conta.valor.toFixed(2)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
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
                    name="data_transacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data da Transação *</FormLabel>
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
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descrição da transação" {...field} />
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
                        <Textarea placeholder="Observações sobre a transação" {...field} />
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
                    {editingTransacao ? "Atualizar" : "Registrar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recebimentos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totais.recebimentos.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pagamentos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {totais.pagamentos.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
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
                placeholder="Buscar por descrição, cliente ou fornecedor..."
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
                <SelectItem value="recebimento">Recebimento</SelectItem>
                <SelectItem value="pagamento">Pagamento</SelectItem>
              </SelectContent>
            </Select>
            <Select value={formaPagamentoFilter} onValueChange={setFormaPagamentoFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por forma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as formas</SelectItem>
                {formasPagamento.map((forma) => (
                  <SelectItem key={forma.value} value={forma.value}>
                    {forma.label}
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
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Forma de Pagamento</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransacoes.map((transacao) => (
                <TableRow key={transacao.id}>
                  <TableCell>
                    {format(new Date(transacao.data_transacao), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={transacao.tipo === "recebimento" ? "default" : "destructive"}>
                      {transacao.tipo === "recebimento" ? "Recebimento" : "Pagamento"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {transacao.descricao || 
                         transacao.contas_receber?.descricao || 
                         transacao.contas_pagar?.descricao}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {transacao.contas_receber?.clientes?.nome || 
                         transacao.contas_pagar?.fornecedores?.nome}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`flex items-center space-x-2 ${
                      transacao.tipo === "recebimento" ? "text-green-600" : "text-red-600"
                    }`}>
                      {transacao.tipo === "recebimento" ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span>R$ {transacao.valor.toFixed(2)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getFormaPagamentoLabel(transacao.forma_pagamento)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(transacao)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(transacao.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredTransacoes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma transação encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}