import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface WorkShiftsFiltersProps {
  search: string;
  setSearch: (search: string) => void;
  sortBy: 'name' | 'room' | 'group' | 'floor';
  setSortBy: (sort: 'name' | 'room' | 'group' | 'floor') => void;
}

export const WorkShiftsFilters = ({
  search,
  setSearch,
  sortBy,
  setSortBy
}: WorkShiftsFiltersProps) => {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Поиск</Label>
        <Input 
          placeholder="Поиск по имени, комнате, группе..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
      </div>
      <div className="space-y-2">
        <Label>Сортировка</Label>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">По имени</SelectItem>
            <SelectItem value="room">По комнате</SelectItem>
            <SelectItem value="group">По группе</SelectItem>
            <SelectItem value="floor">По этажу</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
