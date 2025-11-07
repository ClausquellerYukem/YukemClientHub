import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FileSpreadsheet, Printer, Play, Table, Code, BarChart3, Plus, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Predefined reports list
const predefinedReports = [
  {
    id: 'monthly-revenue-by-client',
    name: 'Faturamento Mensal por Cliente',
    description: 'Receita mensal detalhada de cada cliente com licenças ativas',
    icon: BarChart3,
  },
  {
    id: 'licenses-expiring-soon',
    name: 'Licenças Vencendo (30 Dias)',
    description: 'Licenças que expiram nos próximos 30 dias',
    icon: Table,
  },
  {
    id: 'payment-history',
    name: 'Histórico de Pagamentos',
    description: 'Histórico completo de todas as faturas pagas',
    icon: FileSpreadsheet,
  },
  {
    id: 'pending-invoices',
    name: 'Faturas Pendentes',
    description: 'Todas as faturas aguardando pagamento',
    icon: FileSpreadsheet,
  },
  {
    id: 'sales-performance',
    name: 'Performance de Vendas',
    description: 'Resumo de vendas e receitas por período',
    icon: BarChart3,
  },
];

interface ReportResult {
  reportName?: string;
  description?: string;
  columns: string[];
  rows: any[];
  rowCount: number;
}

interface QueryFilter {
  column: string;
  operator: string;
  value: string;
}

export default function Reports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState("predefined");
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);
  
  // Query Builder state
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [columnInput, setColumnInput] = useState<string>("");
  const [filters, setFilters] = useState<QueryFilter[]>([]);
  const [orderBy, setOrderBy] = useState<string>("");
  const [limitValue, setLimitValue] = useState<string>("100");
  
  // Custom SQL state
  const [customSql, setCustomSql] = useState<string>("");

  // Get database schema for reference (admin only)
  const { data: schema } = useQuery({
    queryKey: ["/api/reports/schema"],
    enabled: isAdmin,
  });

  // Execute predefined report mutation
  const executePredefinedReport = useMutation({
    mutationFn: async (reportId: string) => {
      const res = await apiRequest("POST", `/api/reports/predefined/${reportId}`, {});
      return await res.json();
    },
    onSuccess: (data: ReportResult) => {
      console.log('[REPORTS] Frontend received data:', {
        rowCount: data.rowCount,
        columnsLength: data.columns?.length || 0,
        rowsLength: data.rows?.length || 0,
        firstRow: data.rows?.[0] || null,
        fullData: data
      });
      setReportResult(data);
      toast({
        title: "Relatório executado",
        description: `${data.rowCount ?? 0} registro(s) encontrado(s)`,
      });
    },
    onError: (error: any) => {
      console.error('[REPORTS] Frontend error:', error);
      toast({
        title: "Erro",
        description: error?.error || "Erro ao executar relatório",
        variant: "destructive",
      });
    },
  });

  // Execute query builder mutation
  const executeQueryBuilder = useMutation({
    mutationFn: async () => {
      if (!selectedTable || selectedColumns.length === 0) {
        throw new Error("Selecione uma tabela e pelo menos uma coluna");
      }
      
      const res = await apiRequest("POST", "/api/reports/query-builder", {
        table: selectedTable,
        columns: selectedColumns,
        filters,
        orderBy,
        limit: parseInt(limitValue) || 100,
      });
      return await res.json();
    },
    onSuccess: (data: ReportResult) => {
      setReportResult(data);
      toast({
        title: "Consulta executada",
        description: `${data.rowCount ?? 0} registro(s) encontrado(s)`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error?.error || "Erro ao executar consulta",
        variant: "destructive",
      });
    },
  });

  // Execute custom SQL mutation
  const executeCustomSql = useMutation({
    mutationFn: async () => {
      if (!customSql.trim()) {
        throw new Error("Digite uma consulta SQL");
      }
      
      const res = await apiRequest("POST", "/api/reports/custom-sql", {
        sql: customSql,
      });
      return await res.json();
    },
    onSuccess: (data: ReportResult) => {
      setReportResult(data);
      toast({
        title: "SQL executado",
        description: `${data.rowCount ?? 0} registro(s) encontrado(s)`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error?.error || "Erro ao executar SQL",
        variant: "destructive",
      });
    },
  });

  // Export to Excel
  const exportToExcel = () => {
    if (!reportResult || !reportResult.rows || reportResult.rows.length === 0) {
      toast({
        title: "Aviso",
        description: "Nenhum dado para exportar",
        variant: "destructive",
      });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(reportResult.rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
    
    const fileName = `relatorio_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast({
      title: "Exportado",
      description: "Relatório exportado para Excel com sucesso",
    });
  };

  // Print report
  const printReport = () => {
    if (!reportResult || !reportResult.rows || reportResult.rows.length === 0) {
      toast({
        title: "Aviso",
        description: "Nenhum dado para imprimir",
        variant: "destructive",
      });
      return;
    }
    
    window.print();
  };

  // Add column to query builder
  const addColumn = () => {
    if (columnInput && !selectedColumns.includes(columnInput)) {
      setSelectedColumns([...selectedColumns, columnInput]);
      setColumnInput("");
    }
  };

  // Remove column from query builder
  const removeColumn = (col: string) => {
    setSelectedColumns(selectedColumns.filter(c => c !== col));
  };

  // Add filter to query builder
  const addFilter = () => {
    setFilters([...filters, { column: "", operator: "equals", value: "" }]);
  };

  // Remove filter from query builder
  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  // Update filter
  const updateFilter = (index: number, field: keyof QueryFilter, value: string) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    setFilters(newFilters);
  };

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="print:hidden">
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Relatórios</h1>
        <p className="text-muted-foreground mt-1">
          Gere relatórios customizados e analise seus dados
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="print:hidden">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="predefined" data-testid="tab-predefined-reports">
            Relatórios Predefinidos
          </TabsTrigger>
          <TabsTrigger 
            value="query-builder" 
            disabled={!isAdmin}
            data-testid="tab-query-builder"
          >
            Query Builder {!isAdmin && "(Admin)"}
          </TabsTrigger>
          <TabsTrigger 
            value="custom-sql" 
            disabled={!isAdmin}
            data-testid="tab-custom-sql"
          >
            SQL Customizado {!isAdmin && "(Admin)"}
          </TabsTrigger>
        </TabsList>

        {/* Predefined Reports Tab */}
        <TabsContent value="predefined" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predefinedReports.map((report) => {
              const Icon = report.icon;
              return (
                <Card key={report.id} className="hover-elevate" data-testid={`card-report-${report.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Icon className="h-5 w-5 text-primary" />
                          {report.name}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {report.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardFooter>
                    <Button
                      onClick={() => executePredefinedReport.mutate(report.id)}
                      disabled={executePredefinedReport.isPending}
                      className="w-full"
                      data-testid={`button-run-report-${report.id}`}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Executar
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Query Builder Tab */}
        <TabsContent value="query-builder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Construtor de Consultas</CardTitle>
              <CardDescription>
                Monte sua consulta visualmente selecionando tabelas e colunas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Table Selection */}
              <div className="space-y-2">
                <Label htmlFor="table-select">Tabela</Label>
                <Select value={selectedTable} onValueChange={setSelectedTable}>
                  <SelectTrigger id="table-select" data-testid="select-table">
                    <SelectValue placeholder="Selecione uma tabela" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clients" data-testid="option-table-clients">Clientes (clients)</SelectItem>
                    <SelectItem value="licenses" data-testid="option-table-licenses">Licenças (licenses)</SelectItem>
                    <SelectItem value="invoices" data-testid="option-table-invoices">Faturas (invoices)</SelectItem>
                    <SelectItem value="companies" data-testid="option-table-companies">Empresas (companies)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Columns Selection */}
              <div className="space-y-2">
                <Label>Colunas</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome da coluna (ex: id, company_name)"
                    value={columnInput}
                    onChange={(e) => setColumnInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addColumn()}
                    data-testid="input-column-name"
                  />
                  <Button onClick={addColumn} size="icon" data-testid="button-add-column">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedColumns.map((col) => (
                    <Badge key={col} variant="secondary" className="gap-1">
                      {col}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => removeColumn(col)}
                        data-testid={`button-remove-column-${col}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Filtros (WHERE)</Label>
                  <Button variant="outline" size="sm" onClick={addFilter} data-testid="button-add-filter">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Filtro
                  </Button>
                </div>
                {filters.map((filter, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder="Coluna"
                      value={filter.column}
                      onChange={(e) => updateFilter(index, "column", e.target.value)}
                      className="flex-1"
                      data-testid={`input-filter-column-${index}`}
                    />
                    <Select 
                      value={filter.operator} 
                      onValueChange={(val) => updateFilter(index, "operator", val)}
                    >
                      <SelectTrigger className="w-32" data-testid={`select-filter-operator-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">=</SelectItem>
                        <SelectItem value="not_equals">!=</SelectItem>
                        <SelectItem value="greater">&gt;</SelectItem>
                        <SelectItem value="less">&lt;</SelectItem>
                        <SelectItem value="like">LIKE</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Valor"
                      value={filter.value}
                      onChange={(e) => updateFilter(index, "value", e.target.value)}
                      className="flex-1"
                      data-testid={`input-filter-value-${index}`}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeFilter(index)}
                      data-testid={`button-remove-filter-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Order By */}
              <div className="space-y-2">
                <Label htmlFor="order-by">Ordenar Por (ORDER BY)</Label>
                <Input
                  id="order-by"
                  placeholder="Nome da coluna (ex: created_at)"
                  value={orderBy}
                  onChange={(e) => setOrderBy(e.target.value)}
                  data-testid="input-order-by"
                />
              </div>

              {/* Limit */}
              <div className="space-y-2">
                <Label htmlFor="limit">Limite de Registros (LIMIT)</Label>
                <Input
                  id="limit"
                  type="number"
                  placeholder="100"
                  value={limitValue}
                  onChange={(e) => setLimitValue(e.target.value)}
                  data-testid="input-limit"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => executeQueryBuilder.mutate()}
                disabled={executeQueryBuilder.isPending || !selectedTable || selectedColumns.length === 0}
                className="w-full"
                data-testid="button-execute-query-builder"
              >
                <Play className="h-4 w-4 mr-2" />
                Executar Consulta
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Custom SQL Tab */}
        <TabsContent value="custom-sql" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SQL Customizado</CardTitle>
              <CardDescription>
                Execute consultas SQL personalizadas (apenas SELECT permitido)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-sql">Consulta SQL</Label>
                <Textarea
                  id="custom-sql"
                  placeholder="SELECT * FROM clients WHERE status = 'active' LIMIT 100"
                  value={customSql}
                  onChange={(e) => setCustomSql(e.target.value)}
                  className="font-mono min-h-[200px]"
                  data-testid="textarea-custom-sql"
                />
              </div>

              {/* Database Reference */}
              {schema && (
                <div className="space-y-2">
                  <Label>Referência do Banco de Dados</Label>
                  <div className="rounded-md border p-4 bg-muted/50 max-h-64 overflow-y-auto">
                    <div className="space-y-4 text-sm">
                      {schema.tables.map((table: any) => (
                        <div key={table.name}>
                          <p className="font-semibold text-primary">{table.name}</p>
                          <p className="text-xs text-muted-foreground mb-2">{table.description}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {table.columns.map((col: any) => (
                              <div key={col.name} className="flex gap-2">
                                <Badge variant="outline" className="text-xs font-mono">
                                  {col.name}
                                </Badge>
                                <span className="text-muted-foreground">{col.type}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => executeCustomSql.mutate()}
                disabled={executeCustomSql.isPending || !customSql.trim()}
                className="w-full"
                data-testid="button-execute-custom-sql"
              >
                <Code className="h-4 w-4 mr-2" />
                Executar SQL
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results Section */}
      {reportResult && reportResult.rows?.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {reportResult.reportName || "Resultados"}
                </CardTitle>
                {reportResult.description && (
                  <CardDescription className="mt-1">
                    {reportResult.description}
                  </CardDescription>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  {reportResult.rowCount} registro(s) encontrado(s)
                </p>
              </div>
              <div className="flex gap-2 print:hidden">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportToExcel}
                  data-testid="button-export-excel"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar Excel
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={printReport}
                  data-testid="button-print"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm" data-testid="table-results">
                <thead>
                  <tr className="border-b">
                    {reportResult.columns.map((col) => (
                      <th key={col} className="text-left p-3 font-semibold bg-muted">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportResult.rows.map((row, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      {reportResult.columns.map((col) => (
                        <td key={col} className="p-3">
                          {row[col] !== null && row[col] !== undefined 
                            ? String(row[col]) 
                            : <span className="text-muted-foreground italic">null</span>
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {reportResult && (!reportResult.rows || reportResult.rows.length === 0) && (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">
              Nenhum registro encontrado
            </p>
          </CardContent>
        </Card>
      )}

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          table, table * {
            visibility: visible;
          }
          table {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
