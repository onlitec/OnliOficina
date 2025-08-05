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
import { Plus, Edit, Trash2, Search, UserCheck, Clock, CheckCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type EmprestimoFerramenta = Tables<"emprestimos_ferramentas"> & {
  ferramentas?: Tables<"ferramentas">;
};

type Ferramenta = Tables<"ferramentas">;

const emprestimoSchema = z.object({
  ferramenta_id: z.string().min(1, "Ferramenta é obrigatória"),
  responsavel: z.string().min(1, "Responsável é obrigatório"),
  data_emprestimo: z.string().min(1, "Data de empréstimo é obrigatória"),
  data_prevista_devolucao: z.string().min(1, "Data prevista de devolução é obrigatória"),
  data_devolucao: z.string().optional(),
  observacoes: z.string().optional(),
  status: z.enum(["emprestado", "devolvido"], {
    required_error: "Status é obrigatório",
  }),
});

type EmprestimoFormData = z.infer<typeof emprestimoSchema>;

export function EmprestimosFerramentas() {
  const [emprestimos, setEmprestimos] = useState<EmprestimoFerramenta[]>([]);
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmprestimo, setEditingEmprestimo] = useState<EmprestimoFerramenta | null>(null);

  const form = useForm<EmprestimoFormData>({
    resolver: zodResolver(emprestimoSchema),
    defaultValues: {
      ferramenta_id: "",
      responsavel: "",
      data_emprestimo: "",
      data_prevista_devolucao: "",
      data_devolucao: "",
      observacoes: "",
      status: "emprestado",
    },
  });

  useEffect(() => {
    fetchEmprestimos();
    fetchFerramentas();
  }, []);

  const fetchEmprestimos = async () => {
    try {
      const { data, error } = await supabase
        .from("emprestimos_ferramentas")
        .select(`
          *,
          ferramentas (
            id,
            codigo,
            nome,
            marca,
            modelo
          )
        `)
        .order("data_emprestimo", { ascending: false });

      if (error) throw error;
      setEmprestimos(data || []);
    } catch (error) {
      console.error("Erro ao buscar empréstimos:", error);
      toast.error("Erro ao carregar empréstimos");
    } finally {
      setLoading(false);
    }
  };

  const fetchFerramentas = async () => {
    try {
      const { data, error } = await supabase
        .from("ferramentas")
        .select("*")
        .eq("status", "disponivel")
        .order("nome");

      if (error) throw error;
      setFerramentas(data || []);
    } catch (error) {
      console.error("Erro ao buscar ferramentas:", error);
      toast.error("Erro ao carregar ferramentas");
    }
  };

  const onSubmit = async (data: EmprestimoFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const emprestimoData = {
        ferramenta_id: data.ferramenta_id,
        responsavel: data.responsavel,
        data_emprestimo: data.data_emprestimo,
        data_prevista_devolucao: data.data_prevista_devolucao,
        data_devolucao: data.data_devolucao || null,
        observacoes: data.observacoes || null,
        status: data.status,
      };

      if (editingEmprestimo) {
        const { error } = await supabase
          .from("emprestimos_ferramentas")
          .update({
            ...emprestimoData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingEmprestimo.id);

        if (error) throw error;
        
        // Atualizar status da ferramenta se necessário
        if (data.status === "devolvido" && editingEmprestimo.status === "emprestado") {
          await supabase
            .from("ferramentas")
            .update({ status: "disponivel" })
            .eq("id", data.ferramenta_id);
        }
        
        toast.success("Empréstimo atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("emprestimos_ferramentas")
          .insert({
            ...emprestimoData,
            user_id: user.id,
          });

        if (error) throw error;
        
        // Atualizar status da ferramenta para emprestada
        await supabase
          .from("ferramentas")
          .update({ status: "emprestada", responsavel_atual: data.responsavel })
          .eq("id", data.ferramenta_id);
        
        toast.success("Empréstimo criado com sucesso!");
      }

      setIsDialogOpen(false);
      setEditingEmprestimo(null);
      form.reset();
      fetchEmprestimos();
      fetchFerramentas();
    } catch (error) {
      console.error("Erro ao salvar empréstimo:", error);
      toast.error("Erro ao salvar empréstimo");
    }
  };

  const handleEdit = (emprestimo: EmprestimoFerramenta) => {
    setEditingEmprestimo(emprestimo);
    form.reset({
      ferramenta_id: emprestimo.ferramenta_id,
      responsavel: emprestimo.responsavel,
      data_emprestimo: emprestimo.data_emprestimo,
      data_prevista_devolucao: emprestimo.data_prevista_devolucao,
      data_devolucao: emprestimo.data_devolucao || "",
      observacoes: emprestimo.observacoes || "",
      status: emprestimo.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este empréstimo?")) return;

    try {
      const { error } = await supabase
        .from("emprestimos_ferramentas")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Empréstimo excluído com sucesso!");
      fetchEmprestimos();
    } catch (error) {
      console.error("Erro ao excluir empréstimo:", error);
      toast.error("Erro ao excluir empréstimo");
    }
  };

  const handleDevolver = async (emprestimo: EmprestimoFerramenta) => {
    try {
      const dataAtual = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from("emprestimos_ferramentas")
        .update({
          status: "devolvido",
          data_devolucao: dataAtual,
          updated_at: new Date().toISOString(),
        })
        .eq("id", emprestimo.id);

      if (error) throw error;
      
      // Atualizar status da ferramenta para disponível
      await supabase
        .from("ferramentas")
        .update({ status: "disponivel", responsavel_atual: null })
        .eq("id", emprestimo.ferramenta_id);
      
      toast.success("Ferramenta devolvida com sucesso!");
      fetchEmprestimos();
      fetchFerramentas();
    } catch (error) {
      console.error("Erro ao devolver ferramenta:", error);
      toast.error("Erro ao devolver ferramenta");
    }
  };

  const filteredEmprestimos = emprestimos.filter((emprestimo) => {
    const matchesSearch = emprestimo.responsavel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emprestimo.ferramentas?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emprestimo.ferramentas?.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || emprestimo.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleNewEmprestimo = () => {
    setEditingEmprestimo(null);
    form.reset({
      ferramenta_id: "",
      responsavel: "",
      data_emprestimo: new Date().toISOString().split('T')[0],
      data_prevista_devolucao: "",
      data_devolucao: "",
      observacoes: "",
      status: "emprestado",
    });
    setIsDialogOpen(true);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "emprestado":
        return "secondary";
      case "devolvido":
        return "default";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "emprestado":
        return "Emprestado";
      case "devolvido":
        return "Devolvido";
      default:
        return status;
    }
  };

  const isAtrasado = (emprestimo: EmprestimoFerramenta) => {
    if (emprestimo.status === "devolvido") return false;
    return new Date(emprestimo.data_prevista_devolucao) < new Date();
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Empréstimos de Ferramentas</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewEmprestimo}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Empréstimo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingEmprestimo ? "Editar Empréstimo" : "Novo Empréstimo"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="ferramenta_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ferramenta *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a ferramenta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ferramentas.map((ferramenta) => (
                            <SelectItem key={ferramenta.id} value={ferramenta.id}>
                              {ferramenta.codigo} - {ferramenta.nome}
                              {ferramenta.marca && ` (${ferramenta.marca})`}
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
                  name="responsavel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do responsável" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="data_emprestimo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Empréstimo *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="data_prevista_devolucao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Prevista de Devolução *</FormLabel>
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
                            <SelectItem value="emprestado">Emprestado</SelectItem>
                            <SelectItem value="devolvido">Devolvido</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {form.watch("status") === "devolvido" && (
                    <FormField
                      control={form.control}
                      name="data_devolucao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Devolução</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Observações sobre o empréstimo" {...field} />
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
                    {editingEmprestimo ? "Atualizar" : "Criar"}
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
                placeholder="Buscar por responsável ou ferramenta..."
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
                <SelectItem value="emprestado">Emprestado</SelectItem>
                <SelectItem value="devolvido">Devolvido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ferramenta</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Data Empréstimo</TableHead>
                <TableHead>Prev. Devolução</TableHead>
                <TableHead>Data Devolução</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmprestimos.map((emprestimo) => (
                <TableRow key={emprestimo.id} className={isAtrasado(emprestimo) ? "bg-red-50" : ""}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {emprestimo.ferramentas?.codigo} - {emprestimo.ferramentas?.nome}
                      </div>
                      {emprestimo.ferramentas?.marca && (
                        <div className="text-sm text-muted-foreground">
                          {emprestimo.ferramentas.marca} {emprestimo.ferramentas.modelo}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <UserCheck className="h-4 w-4" />
                      <span>{emprestimo.responsavel}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(emprestimo.data_emprestimo), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>
                        {format(new Date(emprestimo.data_prevista_devolucao), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                      {isAtrasado(emprestimo) && (
                        <Clock className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {emprestimo.data_devolucao
                      ? format(new Date(emprestimo.data_devolucao), "dd/MM/yyyy", {
                          locale: ptBR,
                        })
                      : "-"
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(emprestimo.status) as any}>
                      {getStatusLabel(emprestimo.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {emprestimo.status === "emprestado" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDevolver(emprestimo)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(emprestimo)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(emprestimo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredEmprestimos.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum empréstimo encontrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}