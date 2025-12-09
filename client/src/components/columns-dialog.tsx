import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type Props = {
  defaultOrder: string[];
  visible: Record<string, boolean>;
  setVisible: (v: Record<string, boolean>) => void;
  order: string[];
  setOrder: (o: string[]) => void;
  labelFor: (col: string) => string;
  onSave: () => void;
};

export function ColumnsDialog({ defaultOrder, visible, setVisible, order, setOrder, labelFor, onSave }: Props) {
  return (
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle>Colunas</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        {defaultOrder.map((col, idx) => (
          <div key={col} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox checked={visible[col] !== false} onCheckedChange={(v) => setVisible({ ...visible, [col]: !!v })} />
              <span>{labelFor(col)}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                if (idx <= 0) return;
                const next = [...order];
                const i = next.indexOf(col);
                [next[i - 1], next[i]] = [next[i], next[i - 1]];
                setOrder(next);
              }}>Subir</Button>
              <Button variant="outline" size="sm" onClick={() => {
                const next = [...order];
                const i = next.indexOf(col);
                if (i >= next.length - 1) return;
                [next[i + 1], next[i]] = [next[i], next[i + 1]];
                setOrder(next);
              }}>Descer</Button>
            </div>
          </div>
        ))}
      </div>
      <DialogFooter>
        <Button onClick={onSave} data-testid="button-save-columns">Salvar</Button>
      </DialogFooter>
    </DialogContent>
  );
}

