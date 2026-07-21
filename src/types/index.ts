// Type definitions for events and workshops

export interface Coordinator {
  name: string;
  phone: string;
}

export interface Event {
  id: number;
  title: string;
  type: "tech" | "non-tech";
  date: string;
  time: string;
  venue: string;
  description: string;
  speakers?: string[];
  capacity?: number;
  registrations?: number;
  tags?: string[];
  image?: string;
  price?: string; // Optional field for event price
  maxTeamSize?: number; // Maximum team size for events that allow teams
  minTeamSize?: number; // Minimum team size for events that require teams
  coordinators?: Coordinator[];
  rulebookPath?: string;
}

export interface Workshop {
  id: number;
  title: string;
  category: string;
  level?: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  date: string;
  time: string;
  venue: string;
  instructor: string;
  description: string;
  prerequisites?: string[];
  materials?: string[];
  capacity?: number;
  registrations?: number;
  price: string;
  tags?: string[];
  syllabus?: string[];
  coordinators?: Coordinator[];
  rulebookPath?: string;
}

// Registration types
export interface TeamMember {
  name: string;
  department: string;
  year: string;
  email: string;
  whatsapp: string;
}

// Selected event/workshop item structure
export interface SelectedItem {
  id: number;
  title: string;
}

export interface RegistrationFormData {
  // Primary participant details
  name: string;
  department: string;
  email: string;
  whatsapp: string;
  college: string;
  year: string;

  // Team details (conditional)
  isTeamEvent: boolean;
  teamSize?: number;
  teamMembers?: TeamMember[];

  // Event selections (storing both ID and title)
  selectedEvents: SelectedItem[];
  selectedWorkshops: SelectedItem[];
  selectedNonTechEvents: SelectedItem[];

  // Payment details
  transactionIds: Record<string, string>; // Flexible structure for individual event/workshop transaction IDs

  // Verification
  hasConsented: boolean;
  selectedPass?: number | null;
}

export interface RegistrationProps {
  preSelectedEventId?: number;
  preSelectedEventType?: "event" | "workshop" | "non-tech";
}

export interface PaymentQR {
  type: "event" | "workshop" | "general";
  eventId?: number; // For individual event/workshop QRs
  eventTitle?: string;
  amount: string;
  qrCode: string;
  description: string;
}
