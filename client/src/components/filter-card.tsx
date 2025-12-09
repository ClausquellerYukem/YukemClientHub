import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilterBuilder, type FilterGroup, type FieldDef } from "@/components/filter-builder";

type Props = {
  title?: string;
  tree: FilterGroup;
  onChange: (t: FilterGroup) => void;
  fields: FieldDef[];
  onAddFilter?: () => void;
  onAddGroup?: () => void;
  onClear: () => void;
  onApply: (t: FilterGroup) => void;
  showAddControls?: boolean;
};

export function FilterCard({ title = "Filtros", tree, onChange, fields, onAddFilter, onAddGroup, onClear, onApply, showAddControls = false }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <FilterBuilder tree={tree} onChange={onChange} fields={fields} />
        <div className="flex gap-2 items-center">
          {showAddControls && onAddFilter && (
            <Button variant="outline" size="sm" onClick={onAddFilter}>Adicionar filtro</Button>
          )}
          {showAddControls && onAddGroup && (
            <Button variant="outline" size="sm" onClick={onAddGroup}>Adicionar grupo</Button>
          )}
          <Button variant="outline" size="sm" onClick={onClear}>Limpar</Button>
          <Button size="sm" onClick={() => onApply(tree)}>Aplicar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
