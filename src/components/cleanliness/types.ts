export interface CleanlinessScore {
  date: string;
  room: string;
  score: 2 | 3 | 4 | 5;
  inspector: string;
}

export interface CleanlinessData {
  [floor: string]: {
    [date: string]: {
      [room: string]: CleanlinessScore;
    };
  };
}

export interface RoomsList {
  [floor: string]: string[];
}

export interface WorkingDays {
  [date: string]: boolean;
}

export interface ClosedRooms {
  [date: string]: string[];
}

export interface ClosedFloors {
  [floor: string]: boolean;
}

export interface CleanlinessSettings {
  rooms: RoomsList;
  workingDays: WorkingDays;
  closedRooms: ClosedRooms;
  closedFloors: ClosedFloors;
  defaultNonWorkingDays: number[];
  generalCleaningDay: number;
}

export type ViewMode = 'week' | 'month';