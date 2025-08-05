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
import { Plus, Edit, Trash2, Search, Settings, AlertTriangle, CheckCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ManutencaoFerramenta = Tables<"manutencoes_ferramentas"> & {
  ferramentas?: Tables<"ferramentas">;
};

type Ferramenta = Tables<"ferramentas">;

const manutencaoSchema = z.object({
  ferramenta_id: z.string().min(1, "Ferramenta é obrigatória"),
  tipo: z.enum(["preventiva", "corretiva"], {
    required_error: "Tipo é obrigatório",
  }),
  data_manutencao: z.string().min(1, "Data de manutenção é obrigatória"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  responsavel: z.string().min(1, "Responsável é obrigatório"),
  custo: z.string().optional(),
  proxima_manutencao: z.string().optional(),
  status: z.enum(["agendada", "em_andamento", "concluida", "cancelada"], {
    required_error: "Status é obrigatório",
  }),
  observacoes: z.string().optional(),
});

type ManutencaoFormData = z.infer<typeof manutencaoSchema>;

export function ManutencaoFerramentas() {
  const [manutencoes, setManutencoes] = useState<ManutencaoFerramenta[]>([]);
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingManutencao, setEditingManutencao] = useState<ManutencaoFerramenta | null>(null);

  const form = useForm<ManutencaoFormData>({
    resolver: zodResolver(manutencaoSchema),
    defaultValues: {
      ferramenta_id: "",
      tipo: "preventiva",
      data_manutencao: "",
      descricao: "",
      responsavel: "",
      custo: "",
      proxima_manutencao: "",
      status: "agendada",
      observacoes: "",
    },
  });

  useEffect(() => {
    fetchManutencoes();
    fetchFerramentas();
  }, []);

  const fetchManutencoes = async () => {
    try {
      const { data, error } = await supabase
        .from("manutencoes_ferramentas")
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
        .order("data_manutencao", { ascending: false });

      if (error) throw error;
      setManutencoes(data || []);
    } catch (error) {
      console.error("Erro ao buscar manutenções:", error);
      toast.error("Erro ao carregar manutenções");
    } finally {
      setLoading(false);
    }
  };

  const fetchFerramentas = async () => {
    try {
      const { data, error } = await supabase
        .from("ferramentas")
        .select("*")
        .order("nome");

      if (error) throw error;
      setFerramentas(data || []);
    } catch (error) {
      console.error("Erro ao buscar ferramentas:", error);
      toast.error("Erro ao carregar ferramentas");
    }
  };

  const onSubmit = async (data: ManutencaoFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const manutencaoData = {
        ferramenta_id: data.ferramenta_id,
        tipo: data.tipo,
        data_manutencao: data.data_manutencao,
        descricao: data.descricao,
        responsavel: data.responsavel,
        custo: data.custo ? parseFloat(data.custo) : null,
        proxima_manutencao: data.proxima_manutencao || null,
        status: data.status,
        observacoes: data.observacoes || null,
      };

      if (editingManutencao) {
        const { error } = await supabase
          .from("manutencoes_ferramentas")
          .update({
            ...manutencaoData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingManutencao.id);

        if (error) throw error;
        
        // Atualizar status da ferramenta se necessário
        if (data.status === "em_andamento" && editingManutencao.status !== "em_andamento") {
          await supabase
            .from("ferramentas")
            .update({ status: "manutencao" })
            .eq("id", data.ferramenta_id);
        } else if (data.status === "concluida" && editingManutencao.status === "em_andamento") {
          await supabase
            .from("ferramentas")
            .update({ 
              status: "disponivel",
              proxima_manutencao: data.proxima_manutencao || null
            })
            .eq("id", data.ferramenta_id);
        }
        
        toast.success("Manutenção atualizada com sucesso!");
      } else {
        const { error } = await supabase
          .from("manutencoes_ferramentas")
          .insert({
            ...manutencaoData,
            user_id: user.id,
          });

        if (error) throw error;
        
        // Atualizar status da ferramenta se necessário
        if (data.status === "em_andamento") {
          await supabase
            .from("ferramentas")
            .update({ status: "manutencao" })
            .eq("id", data.ferramenta_id);
        }
        
        toast.success("Manutenção criada com sucesso!");
      }

      setIsDialogOpen(false);
      setEditingManutencao(null);
      form.reset();
      fetchManutencoes();
      fetchFerramentas();
    } catch (error) {
      console.error("Erro ao salvar manutenção:", error);
      toast.error("Erro ao salvar manutenção");
    }
  };

  const handleEdit = (manutencao: ManutencaoFerramenta) => {
    setEditingManutencao(manutencao);
    form.reset({
      ferramenta_id: manutencao.ferramenta_id,
      tipo: manutencao.tipo,
      data_manutencao: manutencao.data_manutencao,
      descricao: manutencao.descricao,
      responsavel: manutencao.responsavel,
      custo: manutencao.custo?.toString() || "",
      proxima_manutencao: manutencao.proxima_manutencao || "",
      status: manutencao.status,
      observacoes: manutencao.observacoes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta manutenção?")) return;

    try {
      const { error } = await supabase
        .from("manutencoes_ferramentas")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Manutenção excluída com sucesso!");
      fetchManutencoes();
    } catch (error) {
      console.error("Erro ao excluir manutenção:", error);
      toast.error("Erro ao excluir manutenção");
    }
  };

  const handleConcluir = async (manutencao: ManutencaoFerramenta) => {
    try {
      const { error } = await supabase
        .from("manutencoes_ferramentas")
        .update({
          status: "concluida",
          updated_at: new Date().toISOString(),
        })
        .eq("id", manutencao.id);

      if (error) throw error;
      
      // Atualizar status da ferramenta para disponível
      await supabase
        .from("ferramentas")
        .update({ 
          status: "disponivel",
          proxima_manutencao: manutencao.proxima_manutencao || null
        })
        .eq("id", manutencao.ferramenta_id);
      
      toast.success("Manutenção concluída com sucesso!");
      fetchManutencoes();
      fetchFerramentas();
    } catch (error) {
      console.error("Erro ao concluir manutenção:", error);
      toast.error("Erro ao concluir manutenção");
    }
  };

  const filteredManutencoes = manutencoes.filter((manutencao) => {
    const matchesSearch = manutencao.responsavel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         manutencao.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         manutencao.ferramentas?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         manutencao.ferramentas?.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || manutencao.status === statusFilter;
    const matchesTipo = tipoFilter === "todos" || manutencao.tipo === tipoFilter;
    
    return matchesSearch && matchesStatus && matchesTipo;
  });

  const handleNewManutencao = () => {
    setEditingManutencao(null);
    form.reset({
      ferramenta_id: "",
      tipo: "preventiva",
      data_manutencao: new Date().toISOString().split('T')[0],
      descricao: "",
      responsavel: "",
      custo: "",
      proxima_manutencao: "",
      status: "agendada",
      observacoes: "",
    });
    setIsDialogOpen(true);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "agendada":
        return "outline";
      case "em_andamento":
        return "secondary";
      case "concluida":
        return "default";
      case "cancelada":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "agendada":
        return "Agendada";
      case "em_andamento":
        return "Em Andamento";
      case "concluida":
        return "Concluída";
      case "cancelada":
        return "Cancelada";
      default:
        return status;
    }
  };

  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case "preventiva":
        return "default";
      case "corretiva":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "preventiva":
        return "Preventiva";
      case "corretiva":
        return "Corretiva";
      default:
        return tipo;
    }
  };

  const isVencida = (manutencao: ManutencaoFerramenta) => {
    if (manutencao.status === "concluida" || manutencao.status === "cancelada") return false;
    return new Date(manutencao.data_manutencao) < new Date();
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manutenção de Ferramentas</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewManutencao}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Manutenção
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingManutencao ? "Editar Manutenção" : "Nova Manutenção"}
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
                            <SelectItem value="preventiva">Preventiva</SelectItem>
                            <SelectItem value="corretiva">Corretiva</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                            <SelectItem value="agendada">Agendada</SelectItem>
                            <SelectItem value="em_andamento">Em Andamento</SelectItem>
                            <SelectItem value="concluida">Concluída</SelectItem>
                            <SelectItem value="cancelada">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="data_manutencao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Manutenção *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                      <FormLabel>Descrição *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descrição da manutenção" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
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
                  <FormField
                    control={form.control}
                    name="custo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custo</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="proxima_manutencao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Próxima Manutenção</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                        <Textarea placeholder="Observações sobre a manutenção" {...field} />
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
                    {editingManutencao ? "Atualizar" : "Criar"}
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
                placeholder="Buscar por responsável, descrição ou ferramenta..."
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
                <SelectItem value="agendada">Agendada</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="preventiva">Preventiva</SelectItem>
                <SelectItem value="corretiva">Corretiva</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ferramenta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredManutencoes.map((manutencao) => (
                <TableRow key={manutencao.id} className={isVencida(manutencao) ? "bg-red-50" : ""}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {manutencao.ferramentas?.codigo} - {manutencao.ferramentas?.nome}
                      </div>
                      {manutencao.ferramentas?.marca && (
                        <div className="text-sm text-muted-foreground">
                          {manutencao.ferramentas.marca} {manutencao.ferramentas.modelo}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTipoBadgeVariant(manutencao.tipo) as any}>
                      {getTipoLabel(manutencao.tipo)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>
                        {format(new Date(manutencao.data_manutencao), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                      {isVencida(manutencao) && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={manutencao.descricao}>
                      {manutencao.descricao}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>{manutencao.responsavel}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {manutencao.custo ? `R$ ${manutencao.custo.toFixed(2)}` : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(manutencao.status) as any}>
                      {getStatusLabel(manutencao.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {manutencao.status === "em_andamento" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConcluir(manutencao)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(manutencao)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(manutencao.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredManutencoes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma manutenção encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}