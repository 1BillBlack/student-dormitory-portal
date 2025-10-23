import { UserPosition } from '@/types/auth';

export const POSITION_NAMES: Record<UserPosition, string> = {
  chairman: 'Председатель студсовета',
  vice_chairman: 'Заместитель председателя студсовета',
  cultural_sector: 'Ответственный за культурно-массовый сектор',
  household_sector: 'Ответственный за хозяйственно-бытовой сектор',
  sports_sector: 'Ответственный за спортивный сектор',
  duty_supervisor: 'Ответственный за дежурства',
  secretary: 'Секретарь студсовета',
  media_sector: 'Ответственный за медиа-сектор',
  floor_2_head: 'Староста второго этажа',
  floor_3_head: 'Староста третьего этажа',
  floor_4_head: 'Староста четвёртого этажа',
  floor_5_head: 'Староста пятого этажа',
  floor_2_cleanliness: 'Ответственный за чистоту второго этажа',
  floor_3_cleanliness: 'Ответственный за чистоту третьего этажа',
  floor_4_cleanliness: 'Ответственный за чистоту четвёртого этажа',
  floor_5_cleanliness: 'Ответственный за чистоту пятого этажа',
};

export const getPositionName = (position: UserPosition): string => {
  return POSITION_NAMES[position] || position;
};

export const getAllPositions = (): UserPosition[] => {
  return Object.keys(POSITION_NAMES) as UserPosition[];
};