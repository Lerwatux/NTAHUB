export type UserProfile = 'Clément' | 'Irène';

export type EventCategory = 
  | 'rdv médical' 
  | 'invités' 
  | 'courses' 
  | 'sortie' 
  | 'anniversaire' 
  | 'autre';

export type EventTarget = 
  | 'toute la famille' 
  | 'Irène' 
  | 'Clément' 
  | 'Imanzi' 
  | 'Ishema' 
  | 'les enfants';

export interface FamilyEvent {
  id: string;
  category: EventCategory;
  target: EventTarget;
  customTitle?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  notifySpouse: boolean;
  createdBy: UserProfile;
  createdAt: string;
  notes?: string;
}

export type IreneWorkStatus = 'bureau' | 'tt' | 'cp' | 'rtt';

export interface IreneDayOverride {
  date: string; // YYYY-MM-DD
  status: IreneWorkStatus;
  notes?: string;
}

export interface PncFlightLeg {
  id: string;
  flightNumber: string; // e.g. "AF7620"
  departureAirport: string; // e.g. "ORY"
  arrivalAirport: string; // e.g. "NCE"
  departureUtc: string; // ISO UTC
  arrivalUtc: string; // ISO UTC
  departureLocal: string; // HH:mm (Paris)
  arrivalLocal: string; // HH:mm (Paris)
  isReturnToOry: boolean;
}

export type PncDayType = 'vol' | 'decoucher' | 'cours_au_sol' | 'off' | 'blanc';

export interface PncDayDuty {
  date: string; // YYYY-MM-DD
  type: PncDayType;
  title: string;
  legs: PncFlightLeg[];
  briefingTime?: string; // HH:mm in Paris local time
  freeTimeAtHome?: string; // HH:mm in Paris local time (1h30 after ORY landing)
  isLayover: boolean; // découcher
  layoverCity?: string;
  rotationId?: string;
  rawSummary?: string;
  notes?: string;
}

export interface ChildActivity {
  id: string;
  childName: 'Imanzi' | 'Ishema' | string;
  activityName: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  color: string;
  location?: string;
  notes?: string;
}

export interface AppNotification {
  id: string;
  recipient: UserProfile;
  sender: UserProfile;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  relatedDate?: string;
}

export interface FreeTimeBlock {
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string; // HH:mm
  type: 'clement' | 'irene' | 'commun';
  description: string;
}

export interface AppSettings {
  // Clément PNC rules
  clementBriefingMinutes: number; // e.g. 75 min (1h15)
  clementHomeAfterLandingMinutes: number; // e.g. 90 min (1h30)
  clementGroundCourseTravelMinutes: number; // e.g. 90 min

  // Irène Work rules
  ireneWorkStart: string; // e.g. "09:00"
  ireneWorkEnd: string; // e.g. "17:00"
  ireneCommuteGoMinutes: number; // e.g. 90 min
  ireneCommuteReturnMinutes: number; // e.g. 90 min
  ireneTtWorkStart: string; // e.g. "09:00"
  ireneTtWorkEnd: string; // e.g. "17:00"

  // Appearance
  darkMode: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  clementBriefingMinutes: 75, // 1h15
  clementHomeAfterLandingMinutes: 90, // 1h30
  clementGroundCourseTravelMinutes: 90, // 1h30
  ireneWorkStart: '09:00',
  ireneWorkEnd: '17:00',
  ireneCommuteGoMinutes: 90, // 1h30
  ireneCommuteReturnMinutes: 90, // 1h30
  ireneTtWorkStart: '09:00',
  ireneTtWorkEnd: '17:00',
  darkMode: false,
};

