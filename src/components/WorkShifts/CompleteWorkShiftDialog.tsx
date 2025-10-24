import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CompleteWorkShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  completeDays: string;
  setCompleteDays: (days: string) => void;
  onComplete: () => void;
}

export const CompleteWorkShiftDialog = ({
  open,
  onOpenChange,
  completeDays,
  setCompleteDays,
  onComplete
}: CompleteWorkShiftDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Списать отработки</DialogTitle>
          <DialogDescription>Укажите сколько дней списать</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Количество дней</Label>
          <Input 
            type="number" 
            placeholder="Кол-во дней" 
            value={completeDays} 
            onChange={(e) => setCompleteDays(e.target.value)} 
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={onComplete}>Списать</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
