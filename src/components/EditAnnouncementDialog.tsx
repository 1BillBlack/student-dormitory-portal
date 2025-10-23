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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: string;
  date: string;
}

interface EditAnnouncementDialogProps {
  announcement: Announcement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (id: number, announcement: { title: string; content: string; priority: string }) => void;
}

export const EditAnnouncementDialog = ({ announcement, open, onOpenChange, onEdit }: EditAnnouncementDialogProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium'>('medium');
  const { toast } = useToast();

  useEffect(() => {
    if (announcement) {
      setTitle(announcement.title);
      setContent(announcement.content);
      setPriority(announcement.priority as 'high' | 'medium');
    }
  }, [announcement]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim() || !announcement) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }

    onEdit(announcement.id, { title, content, priority });
    
    toast({
      title: 'Успешно!',
      description: 'Объявление обновлено',
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Редактировать объявление</DialogTitle>
          <DialogDescription>
            Внесите изменения в объявление
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Заголовок</Label>
              <Input
                id="edit-title"
                placeholder="Введите заголовок"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content">Содержание</Label>
              <Textarea
                id="edit-content"
                placeholder="Введите текст объявления"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-priority">Приоритет</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as 'high' | 'medium')}>
                <SelectTrigger id="edit-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medium">Обычное</SelectItem>
                  <SelectItem value="high">Важно</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
