export interface Ticket {
  id: number;
  ticketRef: string;
  title: string;
  description: string;
  status: 'CREATED' | 'PROCESSING' | 'COMPLETED' | string;
  reportType?: string;
  submittedByEmail?: string;
  submittedByName?: string;
  creationDate?: string;
  updatedDate?: string;
}

export interface UserAccount {
  id: number;
  userRef: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'AGENT';
  password?: string;
}

export type AppView = 'auth' | 'agent-dashboard' | 'client-simulator';
