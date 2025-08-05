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

type ContaReceber = Tables<"contas_receber"> & {
  clientes?: Tables<"clientes">;
  ordens_servico?: Tables<"ordens_servico">;
};

type Cliente = Tables<"clientes">;
type OrdemServico = Tables<"ordens_servico">;

const contaReceberSchema = z.object({
  cliente_id: z.string().min(1, "Cliente é obrigatório"),
  ordem_servico_id: z.string().optional(),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  valor: z.string().min(1, "Valor é obrigatório"),
  data_vencimento: z.string().min(1, "Data de vencimento é obrigatória"),
  data_recebimento: z.string().optional(),
  valor_recebido: z.string().optional(),
  juros: z.string().optional(),
  desconto: z.string().optional(),
  status: z.enum(["pendente", "pago", "vencido", "cancelado"], {
    required_error: "Status é obrigatório",
  }),
  observacoes: z.string().optional(),
});

type ContaReceberFormData = z.infer<typeof contaReceberSchema>;

export function ContasReceber() {
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaReceber | null>(null);

  const form = useForm<ContaReceberFormData>({
    resolver: zodResolver(contaReceberSchema),
    defaultValues: {
      cliente_id: "",
      ordem_servico_id: "",
      descricao: "",
      valor: "",
      data_vencimento: "",
      data_recebimento: "",
      valor_recebido: "",
      juros: "",
      desconto: "",
      status: "pendente",
      observacoes: "",
    },
  });

  useEffect(() => {
    fetchContas();
    fetchClientes();
    fetchOrdensServico();
  }, []);

  const fetchContas = async () => {
    try {
      const { data, error } = await supabase
        .from("contas_receber")
        .select(`
          *,
          clientes (
            id,
            nome,
            cpf_cnpj
          ),
          ordens_servico (
            id,
            numero_os
          )
        `)
        .order("data_vencimento", { ascending: true });

      if (error) throw error;
      setContas(data || []);
    } catch (error) {
      console.error("Erro ao buscar contas a receber:", error);
      toast.error("Erro ao carregar contas a receber");
    } finally {
      setLoading(false);
    }
  };

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("nome");

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      toast.error("Erro ao carregar clientes");
    }
  };

  const fetchOrdensServico = async () => {
    try {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select("*")
        .order("numero_os", { ascending: false });

      if (error) throw error;
      setOrdensServico(data || []);
    } catch (error) {
      console.error("Erro ao buscar ordens de serviço:", error);
      toast.error("Erro ao carregar ordens de serviço");
    }
  };

  const onSubmit = async (data: ContaReceberFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const contaData = {
        cliente_id: data.cliente_id,
        ordem_servico_id: data.ordem_servico_id || null,
        descricao: data.descricao,
        valor: parseFloat(data.valor),
        data_vencimento: data.data_vencimento,
        data_recebimento: data.data_recebimento || null,
        valor_recebido: data.valor_recebido ? parseFloat(data.valor_recebido) : null,
        juros: data.juros ? parseFloat(data.juros) : null,
        desconto: data.desconto ? parseFloat(data.desconto) : null,
        status: data.status,
        observacoes: data.observacoes || null,
      };

      if (editingConta) {
        const { error } = await supabase
          .from("contas_receber")
          .update({
            ...contaData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingConta.id);

        if (error) throw error;
        toast.success("Conta a receber atualizada com sucesso!");
      } else {
        const { error } = await supabase
          .from("contas_receber")
          .insert({
            ...contaData,
            user_id: user.id,
          });

        if (error) throw error;
        toast.success("Conta a receber criada com sucesso!");
      }

      setIsDialogOpen(false);
      setEditingConta(null);
      form.reset();
      fetchContas();
    } catch (error) {
      console.error("Erro ao salvar conta a receber:", error);
      toast.error("Erro ao salvar conta a receber");
    }
  };

  const handleEdit = (conta: ContaReceber) => {
    setEditingConta(conta);
    form.reset({
      cliente_id: conta.cliente_id,
      ordem_servico_id: conta.ordem_servico_id || "",
      descricao: conta.descricao,
      valor: conta.valor.toString(),
      data_vencimento: conta.data_vencimento,
      data_recebimento: conta.data_recebimento || "",
      valor_recebido: conta.valor_recebido?.toString() || "",
      juros: conta.juros?.toString() || "",
      desconto: conta.desconto?.toString() || "",
      status: conta.status,
      observacoes: conta.observacoes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta conta a receber?")) return;

    try {
      const { error } = await supabase
        .from("contas_receber")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Conta a receber excluída com sucesso!");
      fetchContas();
    } catch (error) {
      console.error("Erro ao excluir conta a receber:", error);
      toast.error("Erro ao excluir conta a receber");
    }
  };

  const handleReceberPagamento = async (conta: ContaReceber) => {
    try {
      const dataAtual = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from("contas_receber")
        .update({
          status: "pago",
          data_recebimento: dataAtual,
          valor_recebido: conta.valor,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conta.id);

      if (error) throw error;
      
      toast.success("Pagamento recebido com sucesso!");
      fetchContas();
    } catch (error) {
      console.error("Erro ao receber pagamento:", error);
      toast.error("Erro ao receber pagamento");
    }
  };

  const filteredContas = contas.filter((conta) => {
    const matchesSearch = conta.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conta.clientes?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conta.clientes?.cpf_cnpj.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conta.ordens_servico?.numero_os.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || conta.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleNewConta = () => {
    setEditingConta(null);
    form.reset({
      cliente_id: "",
      ordem_servico_id: "",
      descricao: "",
      valor: "",
      data_vencimento: "",
      data_recebimento: "",
      valor_recebido: "",
      juros: "",
      desconto: "",
      status: "pendente",
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

  const isVencida = (conta: ContaReceber) => {
    if (conta.status === "pago" || conta.status === "cancelado") return false;
    return new Date(conta.data_vencimento) < new Date();
  };

  const calcularValorTotal = (conta: ContaReceber) => {
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
        <h1 className="text-3xl font-bold">Contas a Receber</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewConta}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Conta a Receber
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConta ? "Editar Conta a Receber" : "Nova Conta a Receber"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cliente_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clientes.map((cliente) => (
                              <SelectItem key={cliente.id} value={cliente.id}>
                                {cliente.nome} - {cliente.cpf_cnpj}
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
                    name="ordem_servico_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ordem de Serviço</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a OS (opcional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Nenhuma</SelectItem>
                            {ordensServico.map((os) => (
                              <SelectItem key={os.id} value={os.id}>
                                OS {os.numero_os}
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
                        <Textarea placeholder="Descrição da conta a receber" {...field} />
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
                      name="data_recebimento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Recebimento</FormLabel>
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
                      name="valor_recebido"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Recebido</FormLabel>
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
                placeholder="Buscar por descrição, cliente ou OS..."
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
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>OS</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContas.map((conta) => (
                <TableRow key={conta.id} className={isVencida(conta) ? "bg-red-50" : ""}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{conta.clientes?.nome}</div>
                      <div className="text-sm text-muted-foreground">
                        {conta.clientes?.cpf_cnpj}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={conta.descricao}>
                      {conta.descricao}
                    </div>
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
                    {conta.ordens_servico?.numero_os || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {conta.status === "pendente" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReceberPagamento(conta)}
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
              Nenhuma conta a receber encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}