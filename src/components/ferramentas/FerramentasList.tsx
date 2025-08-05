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
import { Plus, Edit, Trash2, Search, Wrench, AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Ferramenta = Tables<"ferramentas">;

const ferramentaSchema = z.object({
  codigo: z.string().min(1, "Código é obrigatório"),
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  numero_serie: z.string().optional(),
  data_aquisicao: z.string().optional(),
  valor_aquisicao: z.string().optional(),
  localizacao: z.string().optional(),
  status: z.enum(["disponivel", "emprestada", "manutencao", "inativa"], {
    required_error: "Status é obrigatório",
  }),
  responsavel_atual: z.string().optional(),
  proxima_manutencao: z.string().optional(),
  observacoes: z.string().optional(),
});

type FerramentaFormData = z.infer<typeof ferramentaSchema>;

export function FerramentasList() {
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFerramenta, setEditingFerramenta] = useState<Ferramenta | null>(null);

  const form = useForm<FerramentaFormData>({
    resolver: zodResolver(ferramentaSchema),
    defaultValues: {
      codigo: "",
      nome: "",
      descricao: "",
      marca: "",
      modelo: "",
      numero_serie: "",
      data_aquisicao: "",
      valor_aquisicao: "",
      localizacao: "",
      status: "disponivel",
      responsavel_atual: "",
      proxima_manutencao: "",
      observacoes: "",
    },
  });

  useEffect(() => {
    fetchFerramentas();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FerramentaFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const ferramentaData = {
        codigo: data.codigo,
        nome: data.nome,
        descricao: data.descricao || null,
        marca: data.marca || null,
        modelo: data.modelo || null,
        numero_serie: data.numero_serie || null,
        data_aquisicao: data.data_aquisicao || null,
        valor_aquisicao: data.valor_aquisicao ? parseFloat(data.valor_aquisicao) : null,
        localizacao: data.localizacao || null,
        status: data.status,
        responsavel_atual: data.responsavel_atual || null,
        proxima_manutencao: data.proxima_manutencao || null,
        observacoes: data.observacoes || null,
      };

      if (editingFerramenta) {
        const { error } = await supabase
          .from("ferramentas")
          .update({
            ...ferramentaData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingFerramenta.id);

        if (error) throw error;
        toast.success("Ferramenta atualizada com sucesso!");
      } else {
        const { error } = await supabase
          .from("ferramentas")
          .insert({
            ...ferramentaData,
            user_id: user.id,
          });

        if (error) throw error;
        toast.success("Ferramenta criada com sucesso!");
      }

      setIsDialogOpen(false);
      setEditingFerramenta(null);
      form.reset();
      fetchFerramentas();
    } catch (error) {
      console.error("Erro ao salvar ferramenta:", error);
      toast.error("Erro ao salvar ferramenta");
    }
  };

  const handleEdit = (ferramenta: Ferramenta) => {
    setEditingFerramenta(ferramenta);
    form.reset({
      codigo: ferramenta.codigo,
      nome: ferramenta.nome,
      descricao: ferramenta.descricao || "",
      marca: ferramenta.marca || "",
      modelo: ferramenta.modelo || "",
      numero_serie: ferramenta.numero_serie || "",
      data_aquisicao: ferramenta.data_aquisicao || "",
      valor_aquisicao: ferramenta.valor_aquisicao?.toString() || "",
      localizacao: ferramenta.localizacao || "",
      status: ferramenta.status,
      responsavel_atual: ferramenta.responsavel_atual || "",
      proxima_manutencao: ferramenta.proxima_manutencao || "",
      observacoes: ferramenta.observacoes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta ferramenta?")) return;

    try {
      const { error } = await supabase
        .from("ferramentas")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Ferramenta excluída com sucesso!");
      fetchFerramentas();
    } catch (error) {
      console.error("Erro ao excluir ferramenta:", error);
      toast.error("Erro ao excluir ferramenta");
    }
  };

  const filteredFerramentas = ferramentas.filter((ferramenta) => {
    const matchesSearch = ferramenta.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ferramenta.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ferramenta.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ferramenta.modelo?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || ferramenta.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleNewFerramenta = () => {
    setEditingFerramenta(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "disponivel":
        return "default";
      case "emprestada":
        return "secondary";
      case "manutencao":
        return "destructive";
      case "inativa":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "disponivel":
        return "Disponível";
      case "emprestada":
        return "Emprestada";
      case "manutencao":
        return "Manutenção";
      case "inativa":
        return "Inativa";
      default:
        return status;
    }
  };

  const isManutencaoVencida = (ferramenta: Ferramenta) => {
    if (!ferramenta.proxima_manutencao) return false;
    return new Date(ferramenta.proxima_manutencao) < new Date();
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Ferramentas</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewFerramenta}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Ferramenta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFerramenta ? "Editar Ferramenta" : "Nova Ferramenta"}
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
                          <Input placeholder="Código da ferramenta" {...field} />
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
                          <Input placeholder="Nome da ferramenta" {...field} />
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
                        <Textarea placeholder="Descrição da ferramenta" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="marca"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca</FormLabel>
                        <FormControl>
                          <Input placeholder="Marca" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="modelo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modelo</FormLabel>
                        <FormControl>
                          <Input placeholder="Modelo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="numero_serie"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Série</FormLabel>
                        <FormControl>
                          <Input placeholder="Número de série" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="data_aquisicao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Aquisição</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="valor_aquisicao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor de Aquisição</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="localizacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Localização</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Bancada 1, Armário A" {...field} />
                        </FormControl>
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
                            <SelectItem value="disponivel">Disponível</SelectItem>
                            <SelectItem value="emprestada">Emprestada</SelectItem>
                            <SelectItem value="manutencao">Manutenção</SelectItem>
                            <SelectItem value="inativa">Inativa</SelectItem>
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
                    name="responsavel_atual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsável Atual</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do responsável" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                </div>
                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Observações sobre a ferramenta" {...field} />
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
                    {editingFerramenta ? "Atualizar" : "Criar"}
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
                placeholder="Buscar por nome, código, marca ou modelo..."
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
                <SelectItem value="disponivel">Disponível</SelectItem>
                <SelectItem value="emprestada">Emprestada</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
                <SelectItem value="inativa">Inativa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Marca/Modelo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Próx. Manutenção</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFerramentas.map((ferramenta) => (
                <TableRow key={ferramenta.id}>
                  <TableCell className="font-medium">{ferramenta.codigo}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Wrench className="h-4 w-4" />
                      <span>{ferramenta.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {ferramenta.marca && ferramenta.modelo
                      ? `${ferramenta.marca} ${ferramenta.modelo}`
                      : ferramenta.marca || ferramenta.modelo || "-"
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(ferramenta.status)}>
                      {getStatusLabel(ferramenta.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{ferramenta.localizacao || "-"}</TableCell>
                  <TableCell>{ferramenta.responsavel_atual || "-"}</TableCell>
                  <TableCell>
                    {ferramenta.proxima_manutencao ? (
                      <div className="flex items-center space-x-2">
                        <span>
                          {format(new Date(ferramenta.proxima_manutencao), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                        {isManutencaoVencida(ferramenta) && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(ferramenta)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(ferramenta.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredFerramentas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma ferramenta encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}