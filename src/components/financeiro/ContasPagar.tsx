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
import { Plus, Edit, Trash2, Search, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ContaPagar = Tables<"contas_pagar"> & {
  fornecedores?: Tables<"fornecedores">;
};

type Fornecedor = Tables<"fornecedores">;

const contaPagarSchema = z.object({
  fornecedor_id: z.string().min(1, "Fornecedor é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  valor: z.string().min(1, "Valor é obrigatório"),
  data_vencimento: z.string().min(1, "Data de vencimento é obrigatória"),
  data_pagamento: z.string().optional(),
  valor_pago: z.string().optional(),
  juros: z.string().optional(),
  desconto: z.string().optional(),
  status: z.enum(["pendente", "pago", "vencido", "cancelado"], {
    required_error: "Status é obrigatório",
  }),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  observacoes: z.string().optional(),
});

type ContaPagarFormData = z.infer<typeof contaPagarSchema>;

export function ContasPagar() {
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("todas");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaPagar | null>(null);

  const form = useForm<ContaPagarFormData>({
    resolver: zodResolver(contaPagarSchema),
    defaultValues: {
      fornecedor_id: "",
      descricao: "",
      valor: "",
      data_vencimento: "",
      data_pagamento: "",
      valor_pago: "",
      juros: "",
      desconto: "",
      status: "pendente",
      categoria: "",
      observacoes: "",
    },
  });

  const categorias = [
    "Fornecedores",
    "Aluguel",
    "Energia Elétrica",
    "Água",
    "Telefone/Internet",
    "Combustível",
    "Manutenção",
    "Impostos",
    "Salários",
    "Benefícios",
    "Marketing",
    "Seguros",
    "Financiamento",
    "Outros",
  ];

  useEffect(() => {
    fetchContas();
    fetchFornecedores();
  }, []);

  const fetchContas = async () => {
    try {
      const { data, error } = await supabase
        .from("contas_pagar")
        .select(`
          *,
          fornecedores (
            id,
            nome,
            cnpj
          )
        `)
        .order("data_vencimento", { ascending: true });

      if (error) throw error;
      setContas(data || []);
    } catch (error) {
      console.error("Erro ao buscar contas a pagar:", error);
      toast.error("Erro ao carregar contas a pagar");
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  const onSubmit = async (data: ContaPagarFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const contaData = {
        fornecedor_id: data.fornecedor_id,
        descricao: data.descricao,
        valor: parseFloat(data.valor),
        data_vencimento: data.data_vencimento,
        data_pagamento: data.data_pagamento || null,
        valor_pago: data.valor_pago ? parseFloat(data.valor_pago) : null,
        juros: data.juros ? parseFloat(data.juros) : null,
        desconto: data.desconto ? parseFloat(data.desconto) : null,
        status: data.status,
        categoria: data.categoria,
        observacoes: data.observacoes || null,
      };

      if (editingConta) {
        const { error } = await supabase
          .from("contas_pagar")
          .update({
            ...contaData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingConta.id);

        if (error) throw error;
        toast.success("Conta a pagar atualizada com sucesso!");
      } else {
        const { error } = await supabase
          .from("contas_pagar")
          .insert({
            ...contaData,
            user_id: user.id,
          });

        if (error) throw error;
        toast.success("Conta a pagar criada com sucesso!");
      }

      setIsDialogOpen(false);
      setEditingConta(null);
      form.reset();
      fetchContas();
    } catch (error) {
      console.error("Erro ao salvar conta a pagar:", error);
      toast.error("Erro ao salvar conta a pagar");
    }
  };

  const handleEdit = (conta: ContaPagar) => {
    setEditingConta(conta);
    form.reset({
      fornecedor_id: conta.fornecedor_id,
      descricao: conta.descricao,
      valor: conta.valor.toString(),
      data_vencimento: conta.data_vencimento,
      data_pagamento: conta.data_pagamento || "",
      valor_pago: conta.valor_pago?.toString() || "",
      juros: conta.juros?.toString() || "",
      desconto: conta.desconto?.toString() || "",
      status: conta.status,
      categoria: conta.categoria,
      observacoes: conta.observacoes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta conta a pagar?")) return;

    try {
      const { error } = await supabase
        .from("contas_pagar")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Conta a pagar excluída com sucesso!");
      fetchContas();
    } catch (error) {
      console.error("Erro ao excluir conta a pagar:", error);
      toast.error("Erro ao excluir conta a pagar");
    }
  };

  const handlePagar = async (conta: ContaPagar) => {
    try {
      const dataAtual = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from("contas_pagar")
        .update({
          status: "pago",
          data_pagamento: dataAtual,
          valor_pago: conta.valor,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conta.id);

      if (error) throw error;
      
      toast.success("Pagamento realizado com sucesso!");
      fetchContas();
    } catch (error) {
      console.error("Erro ao realizar pagamento:", error);
      toast.error("Erro ao realizar pagamento");
    }
  };

  const filteredContas = contas.filter((conta) => {
    const matchesSearch = conta.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conta.fornecedores?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conta.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || conta.status === statusFilter;
    const matchesCategoria = categoriaFilter === "todas" || conta.categoria === categoriaFilter;
    
    return matchesSearch && matchesStatus && matchesCategoria;
  });

  const handleNewConta = () => {
    setEditingConta(null);
    form.reset({
      fornecedor_id: "",
      descricao: "",
      valor: "",
      data_vencimento: "",
      data_pagamento: "",
      valor_pago: "",
      juros: "",
      desconto: "",
      status: "pendente",
      categoria: "",
      observacoes: "",
    });
    setIsDialogOpen(true);
  };

  const getStatusBadgeVariant = (status: string): "outline" | "default" | "destructive" | "secondary" => {
    switch (status) {
      case "pendente":
        return "outline";
      case "pago":
        return "default";
      case "vencido":
        return "destructive";
      case "cancelado":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pendente":
        return "Pendente";
      case "pago":
        return "Pago";
      case "vencido":
        return "Vencido";
      case "cancelado":
        return "Cancelado";
      default:
        return status;
    }
  };

  const isVencida = (conta: ContaPagar) => {
    if (conta.status === "pago" || conta.status === "cancelado") return false;
    return new Date(conta.data_vencimento) < new Date();
  };

  const calcularValorTotal = (conta: ContaPagar) => {
    let total = conta.valor;
    if (conta.juros) total += conta.juros;
    if (conta.desconto) total -= conta.desconto;
    return total;
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Contas a Pagar</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewConta}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Conta a Pagar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConta ? "Editar Conta a Pagar" : "Nova Conta a Pagar"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fornecedor_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fornecedor *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o fornecedor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {fornecedores.map((fornecedor) => (
                              <SelectItem key={fornecedor.id} value={fornecedor.id}>
                                {fornecedor.nome} - {fornecedor.cnpj}
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
                            {categorias.map((categoria) => (
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
                        <Textarea placeholder="Descrição da conta a pagar" {...field} />
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
                    name="data_vencimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Vencimento *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="pago">Pago</SelectItem>
                            <SelectItem value="vencido">Vencido</SelectItem>
                            <SelectItem value="cancelado">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {(form.watch("status") === "pago") && (
                    <FormField
                      control={form.control}
                      name="data_pagamento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Pagamento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                {(form.watch("status") === "pago") && (
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="valor_pago"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Pago</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="juros"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Juros</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="desconto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Desconto</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Observações sobre a conta" {...field} />
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
                    {editingConta ? "Atualizar" : "Criar"}
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
                placeholder="Buscar por descrição, fornecedor ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {categorias.map((categoria) => (
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
                <TableHead>Fornecedor</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContas.map((conta) => (
                <TableRow key={conta.id} className={isVencida(conta) ? "bg-red-50" : ""}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{conta.fornecedores?.nome}</div>
                      <div className="text-sm text-muted-foreground">
                        {conta.fornecedores?.cnpj}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={conta.descricao}>
                      {conta.descricao}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{conta.categoria}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4" />
                      <span>R$ {calcularValorTotal(conta).toFixed(2)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>
                        {format(new Date(conta.data_vencimento), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                      {isVencida(conta) && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(conta.status)}>
                      {getStatusLabel(conta.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {conta.status === "pendente" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePagar(conta)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(conta)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(conta.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredContas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma conta a pagar encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}