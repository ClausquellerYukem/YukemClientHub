import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export type FilterCond = { id: string; type: 'cond'; field: string; op: string; value?: any; value2?: any };
export type FilterGroup = { id: string; type: 'group'; logical: 'AND' | 'OR'; children: (FilterCond | FilterGroup)[] };

export type FieldDef = {
  key: string;
  label: string;
  type: 'string' | 'enum' | 'boolean' | 'number' | 'date' | 'id';
  enumValues?: Array<{ value: string; label: string }>;
  operators: string[];
};

type Props = {
  tree: FilterGroup;
  onChange: (t: FilterGroup) => void;
  fields: FieldDef[];
};

const uid = () => Math.random().toString(36).slice(2) + Date.now();

const makeCond = (field: string): FilterCond => ({ id: uid(), type: 'cond', field, op: 'equals' });
const makeGroup = (logical: 'AND' | 'OR' = 'AND'): FilterGroup => ({ id: uid(), type: 'group', logical, children: [] });

export function FilterBuilder({ tree, onChange, fields }: Props) {
  const fieldMap = useMemo(() => {
    const m: Record<string, FieldDef> = {};
    for (const f of fields) m[f.key] = f;
    return m;
  }, [fields]);

  const renderCond = (cond: FilterCond, path: number[]) => {
    const field = fieldMap[cond.field] || fields[0];
    const update = (mut: (t: FilterGroup) => void) => {
      const next = { ...tree } as FilterGroup;
      mut(next);
      onChange(next);
    };
    const setField = (key: string) => update((t) => {
      let cursor: any = t;
      for (let i = 0; i < path.length - 1; i++) cursor = cursor.children[path[i]];
      const prevId = cursor.children[path[path.length - 1]].id;
      cursor.children[path[path.length - 1]] = { id: prevId, type: 'cond', field: key, op: 'equals' };
    });
    const setOp = (op: string) => update((t) => {
      let cursor: any = t;
      for (let i = 0; i < path.length - 1; i++) cursor = cursor.children[path[i]];
      cursor.children[path[path.length - 1]].op = op;
      cursor.children[path[path.length - 1]].value = undefined;
      cursor.children[path[path.length - 1]].value2 = undefined;
    });
    const setValue = (v: any) => update((t) => {
      let cursor: any = t;
      for (let i = 0; i < path.length - 1; i++) cursor = cursor.children[path[i]];
      cursor.children[path[path.length - 1]].value = v;
    });
    const setValue2 = (v: any) => update((t) => {
      let cursor: any = t;
      for (let i = 0; i < path.length - 1; i++) cursor = cursor.children[path[i]];
      cursor.children[path[path.length - 1]].value2 = v;
    });
    return (
      <div className="flex flex-wrap items-center gap-2" key={cond.id}>
        <Select value={cond.field} onValueChange={setField}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Campo" /></SelectTrigger>
          <SelectContent>
            {fields.map(f => (<SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={cond.op} onValueChange={setOp}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Operador" /></SelectTrigger>
          <SelectContent>
            {field.operators.map(op => (<SelectItem key={op} value={op}>{op}</SelectItem>))}
          </SelectContent>
        </Select>
        {field.type === 'string' && cond.op !== 'in' && (
          <Input className="flex-1 min-w-[240px]" placeholder="valor" value={String(cond.value ?? '')} onChange={(e) => setValue(e.target.value)} />
        )}
        {field.type === 'string' && cond.op === 'in' && (
          <Input className="flex-1 min-w-[240px]" placeholder="valores separados por vírgula" value={String(cond.value ?? '')} onChange={(e) => setValue(e.target.value)} />
        )}
        {field.type === 'id' && cond.op !== 'in' && (
          <Input className="flex-1 min-w-[240px]" placeholder="valor" value={String(cond.value ?? '')} onChange={(e) => setValue(e.target.value)} />
        )}
        {field.type === 'id' && cond.op === 'in' && (
          <Input className="flex-1 min-w-[240px]" placeholder="valores separados por vírgula" value={String(cond.value ?? '')} onChange={(e) => setValue(e.target.value)} />
        )}
        {field.type === 'enum' && cond.op !== 'in' && (
          <Select value={String(cond.value ?? '')} onValueChange={(v) => setValue(v)}>
            <SelectTrigger className="w-48"><SelectValue placeholder={field.label} /></SelectTrigger>
            <SelectContent>
              {(field.enumValues || []).map(ev => (<SelectItem key={ev.value} value={ev.value}>{ev.label}</SelectItem>))}
            </SelectContent>
          </Select>
        )}
        {field.type === 'enum' && cond.op === 'in' && (
          <div className="flex flex-wrap gap-2">
            {(field.enumValues || []).map(ev => (
              <div key={ev.value} className="flex items-center gap-2">
                <Checkbox checked={Array.isArray(cond.value) && cond.value.includes(ev.value)} onCheckedChange={(v) => {
                  const vals = new Set<string>(Array.isArray(cond.value) ? cond.value : []);
                  if (v) vals.add(ev.value); else vals.delete(ev.value);
                  setValue(Array.from(vals));
                }} />
                <span>{ev.label}</span>
              </div>
            ))}
          </div>
        )}
        {field.type === 'boolean' && (
          <Select value={String(cond.value ?? '')} onValueChange={(v) => setValue(v === 'true')}>
            <SelectTrigger className="w-48"><SelectValue placeholder={field.label} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="false">Não</SelectItem>
              <SelectItem value="true">Sim</SelectItem>
            </SelectContent>
          </Select>
        )}
        {field.type === 'number' && cond.op !== 'between' && (
          <Input className="w-[180px]" type="number" placeholder="valor" value={String(cond.value ?? '')} onChange={(e) => setValue(e.target.value ? parseInt(e.target.value) : undefined)} />
        )}
        {field.type === 'number' && cond.op === 'between' && (
          <div className="flex flex-1 gap-2">
            <Input className="min-w-[160px] flex-1" type="number" placeholder="de" value={String(cond.value ?? '')} onChange={(e) => setValue(e.target.value ? parseInt(e.target.value) : undefined)} />
            <Input className="min-w-[160px] flex-1" type="number" placeholder="até" value={String(cond.value2 ?? '')} onChange={(e) => setValue2(e.target.value ? parseInt(e.target.value) : undefined)} />
          </div>
        )}
        {field.type === 'date' && cond.op !== 'between' && (
          <Input className="min-w-[240px]" type="date" value={String(cond.value ?? '')} onChange={(e) => setValue(e.target.value)} />
        )}
        {field.type === 'date' && cond.op === 'between' && (
          <div className="flex flex-1 gap-2">
            <Input className="min-w-[240px] flex-1" type="date" value={String(cond.value ?? '')} onChange={(e) => setValue(e.target.value)} />
            <Input className="min-w-[240px] flex-1" type="date" value={String(cond.value2 ?? '')} onChange={(e) => setValue2(e.target.value)} />
          </div>
        )}
      </div>
    );
  };

  const renderGroup = (group: FilterGroup, path: number[]) => {
    const update = (mut: (t: FilterGroup) => void) => {
      const next = { ...tree } as FilterGroup;
      mut(next);
      onChange(next);
    };
    const setLogical = (logical: 'AND' | 'OR') => update((t) => {
      let cursor: any = t;
      for (let i = 0; i < path.length; i++) cursor = cursor.children[path[i]];
      cursor.logical = logical;
    });
    const removeChild = (idx: number) => update((t) => {
      let cursor: any = t;
      for (let i = 0; i < path.length; i++) cursor = cursor.children[path[i]];
      cursor.children.splice(idx, 1);
    });
    const addCond = () => update((t) => {
      let cursor: any = t;
      for (let i = 0; i < path.length; i++) cursor = cursor.children[path[i]];
      const firstField = fields[0]?.key || 'description';
      cursor.children.push(makeCond(firstField));
    });
    const addGroup = () => update((t) => {
      let cursor: any = t;
      for (let i = 0; i < path.length; i++) cursor = cursor.children[path[i]];
      cursor.children.push(makeGroup('AND'));
    });
    return (
      <div className="space-y-2" key={group.id}>
        {group.children.map((child, idx) => (
          <div key={(child as any).id} className="space-y-2">
            {idx > 0 && (
              <div className="flex items-center gap-2">
                <span>Combinar com</span>
                <Select value={group.logical} onValueChange={(v) => setLogical(v as any)}>
                  <SelectTrigger className="w-32"><SelectValue placeholder="Operador" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">AND</SelectItem>
                    <SelectItem value="OR">OR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {child.type === 'cond' ? renderCond(child as FilterCond, [...path, idx]) : (
              <div className="space-y-2 border rounded-md p-3">
                {renderGroup(child as FilterGroup, [...path, idx])}
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => removeChild(idx)}>Remover</Button>
            </div>
          </div>
        ))}
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" onClick={addCond}>Adicionar filtro</Button>
          <Button variant="outline" size="sm" onClick={addGroup}>Adicionar grupo</Button>
        </div>
      </div>
    );
  };

  return renderGroup(tree, []);
}

