import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { AdminPanel } from '@/components/AdminPanel';
import { CouncilPanel } from '@/components/CouncilPanel';
import { CleanlinessPanel } from '@/components/CleanlinessPanel';
import { WorkShiftsPanel } from '@/components/WorkShiftsPanel';
import { AnnouncementsTab } from './AnnouncementsTab';
import { ProfileTab } from './ProfileTab';
import { DutiesTab } from './DutiesTab';
import { User, UserPosition } from '@/types/auth';

type TabType = 'home' | 'notifications' | 'profile' | 'duties' | 'cleanliness' | 'admin' | 'council' | 'workshifts';

interface DashboardTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  user: User | null;
  canCreateAnnouncements: boolean;
  canSeeCleanlinessTab: boolean;
  hasCouncilAccess: boolean;
  canSeeAdminPanel: boolean;
  pendingRoomsCount: number;
  filteredAnnouncements: any[];
  availableAudiences: string[];
  onAddAnnouncement: (announcement: any) => void;
  onEditAnnouncement: (id: number, data: any) => void;
  onDeleteAnnouncement: (id: number) => void;
  canEditAnnouncement: (announcement: any) => boolean;
  editingAnnouncement: any;
  setEditingAnnouncement: (announcement: any) => void;
  setDeletingId: (id: number | null) => void;
  onChangeRoom: (room: string) => void;
  statsPeriod: 'week' | 'month' | 'all';
  onStatsPeriodChange: (period: 'week' | 'month' | 'all') => void;
  users: any[];
  onUpdateUser: (user: any) => void;
  onDeleteUser: (id: string) => void;
  onCreateUser: (user: any) => void;
  onUpdatePositions: (userId: string, positions: UserPosition[]) => void;
  onApproveRoom: (userId: string) => void;
  onRejectRoom: (userId: string) => void;
  setDeletingUserId: (id: string | null) => void;
  canManageUsers: boolean;
  isFloorManager: boolean;
  userFloor: string | null;
  canViewLogs: boolean;
}

export const DashboardTabs = ({
  activeTab,
  onTabChange,
  user,
  canCreateAnnouncements,
  canSeeCleanlinessTab,
  hasCouncilAccess,
  canSeeAdminPanel,
  pendingRoomsCount,
  filteredAnnouncements,
  availableAudiences,
  onAddAnnouncement,
  onEditAnnouncement,
  onDeleteAnnouncement,
  canEditAnnouncement,
  editingAnnouncement,
  setEditingAnnouncement,
  setDeletingId,
  onChangeRoom,
  statsPeriod,
  onStatsPeriodChange,
  users,
  onUpdateUser,
  onDeleteUser,
  onCreateUser,
  onUpdatePositions,
  onApproveRoom,
  onRejectRoom,
  setDeletingUserId,
  canManageUsers,
  isFloorManager,
  userFloor,
  canViewLogs,
}: DashboardTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TabType)} className="animate-fade-in">
      <TabsList className={`grid w-full mb-6 h-auto p-1`} style={{
        gridTemplateColumns: `repeat(${[
          true,
          true,
          canSeeCleanlinessTab,
          hasCouncilAccess,
          canSeeAdminPanel
        ].filter(Boolean).length}, minmax(0, 1fr))`
      }}>
        <TabsTrigger value="home" className="gap-2 py-3">
          <Icon name="Home" size={18} />
          <span className="hidden sm:inline">Главная</span>
        </TabsTrigger>
        {canSeeCleanlinessTab && (
          <TabsTrigger value="cleanliness" className="gap-2 py-3">
            <Icon name="Sparkles" size={18} />
            <span className="hidden sm:inline">Чистота</span>
          </TabsTrigger>
        )}
        <TabsTrigger value="workshifts" className="gap-2 py-3">
          <Icon name="Briefcase" size={18} />
          <span className="hidden sm:inline">Отработки</span>
        </TabsTrigger>
        {hasCouncilAccess && (
          <TabsTrigger value="council" className="gap-2 py-3">
            <Icon name="Award" size={18} />
            <span className="hidden sm:inline">Студсовет</span>
          </TabsTrigger>
        )}
        {canSeeAdminPanel && (
          <TabsTrigger value="admin" className="gap-2 py-3">
            <Icon name="Settings" size={18} />
            <span className="hidden sm:inline">Админ-панель</span>
            {pendingRoomsCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 text-xs flex items-center justify-center">
                {pendingRoomsCount}
              </Badge>
            )}
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="home" className="space-y-6">
        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="notifications" className="gap-2">
              <Icon name="Bell" size={18} />
              Уведомления
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <Icon name="User" size={18} />
              Профиль
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-4">
            <AnnouncementsTab
              announcements={filteredAnnouncements}
              canCreateAnnouncements={canCreateAnnouncements}
              availableAudiences={availableAudiences}
              onAddAnnouncement={onAddAnnouncement}
              onEditAnnouncement={onEditAnnouncement}
              onDeleteAnnouncement={onDeleteAnnouncement}
              canEditAnnouncement={canEditAnnouncement}
              editingAnnouncement={editingAnnouncement}
              setEditingAnnouncement={setEditingAnnouncement}
              setDeletingId={setDeletingId}
            />
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <ProfileTab
              userName={user?.name || ''}
              userEmail={user?.email || ''}
              userRole={user?.role || ''}
              userRoom={user?.room}
              userGroup={user?.group}
              userPositions={user?.positions}
              onChangeRoom={onChangeRoom}
              statsPeriod={statsPeriod}
              onStatsPeriodChange={onStatsPeriodChange}
            />
          </TabsContent>
        </Tabs>
      </TabsContent>

      {canSeeCleanlinessTab && (
        <TabsContent value="cleanliness">
          <CleanlinessPanel />
        </TabsContent>
      )}

      <TabsContent value="workshifts">
        <WorkShiftsPanel />
      </TabsContent>

      {hasCouncilAccess && (
        <TabsContent value="council">
          <CouncilPanel />
        </TabsContent>
      )}

      {canSeeAdminPanel && (
        <TabsContent value="admin">
          <AdminPanel
            users={users}
            onUpdateUser={onUpdateUser}
            onDeleteUser={setDeletingUserId}
            onCreateUser={onCreateUser}
            onUpdatePositions={onUpdatePositions}
            onApproveRoom={onApproveRoom}
            onRejectRoom={onRejectRoom}
            canManageUsers={canManageUsers}
            isFloorManager={isFloorManager}
            userFloor={userFloor}
            canViewLogs={canViewLogs}
          />
        </TabsContent>
      )}
    </Tabs>
  );
};
