import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface ChangeRoomDialogProps {
  currentRoom?: string;
  onChangeRoom: (newRoom: string) => void;
}

export const ChangeRoomDialog = ({ currentRoom, onChangeRoom }: ChangeRoomDialogProps) => {
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newRoom, setNewRoom] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRoom.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Укажите номер комнаты',
        variant: 'destructive',
      });
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirm = () => {
    onChangeRoom(newRoom);
    setShowConfirm(false);
    setOpen(false);
    setNewRoom('');
    
    toast({
      title: 'Заявка отправлена',
      description: 'Ваша заявка на смену комнаты отправлена на проверку старосте этажа',
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Icon name="KeyRound" size={18} />
            Изменить комнату
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Изменить комнату</DialogTitle>
            <DialogDescription>
              Укажите новый номер комнаты. Изменение вступит в силу после подтверждения старостой этажа.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {currentRoom && (
                <div className="space-y-2">
                  <Label>Текущая комната</Label>
                  <div className="px-3 py-2 bg-muted rounded-md text-sm">
                    {currentRoom}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="new-room">Новая комната</Label>
                <Input
                  id="new-room"
                  type="text"
                  placeholder="Например, 305"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="gap-2">
                <Icon name="Send" size={18} />
                Отправить на проверку
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердите смену комнаты</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите сменить комнату {currentRoom ? `с ${currentRoom} ` : ''}на {newRoom}?
              {currentRoom && ' До подтверждения старостой вы продолжите видеть текущую комнату.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Подтвердить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
