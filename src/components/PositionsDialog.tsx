import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { User, UserPosition } from '@/types/auth';
import { getPositionName, getAllPositions } from '@/utils/positions';

interface PositionsDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (userId: string, positions: UserPosition[]) => void;
}

export const PositionsDialog = ({ user, open, onOpenChange, onSave }: PositionsDialogProps) => {
  const [selectedPositions, setSelectedPositions] = useState<UserPosition[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setSelectedPositions(user.positions || []);
    }
  }, [user, open]);

  const handleTogglePosition = (position: UserPosition) => {
    setSelectedPositions(prev =>
      prev.includes(position)
        ? prev.filter(p => p !== position)
        : [...prev, position]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    onSave(user.id, selectedPositions);
    
    toast({
      title: 'Успешно!',
      description: 'Должности обновлены',
    });

    onOpenChange(false);
  };

  const allPositions = getAllPositions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Управление должностями</DialogTitle>
          <DialogDescription>
            Назначьте должности для {user?.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-3 py-4">
            {allPositions.map((position) => (
              <div key={position} className="flex items-start space-x-3">
                <Checkbox
                  id={position}
                  checked={selectedPositions.includes(position)}
                  onCheckedChange={() => handleTogglePosition(position)}
                />
                <Label
                  htmlFor={position}
                  className="text-sm font-normal cursor-pointer leading-relaxed"
                >
                  {getPositionName(position)}
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="submit" className="gap-2">
              <Icon name="Check" size={18} />
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
