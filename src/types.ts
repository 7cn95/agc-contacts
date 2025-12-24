export type UserRole = 'guest' | 'admin';

export interface SIMCard {
  id: string;
  employeeName: string;
  phoneNumber: string;
  jobTitle: string;
  workLocation: string;
  // Admin only fields
  billAmount?: number;
  expirationDate?: string; // ISO date string
  status: 'Active' | 'Expired';
  renewalFlag?: boolean;
  creditBalance?: number; // Extra money from renewals
}

export interface RenewalRecord {
  id: string;
  simCardId: string;
  employeeName: string;
  amountPaid: number;
  billAmount: number;
  transactionDate: string; // ISO
  previousExpiry?: string;
  newExpiry: string;
}

export interface WalletDeposit {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface ExternalExpense {
  id: string;
  amount: number;
  date: string;
  description: string;
  relatedPhoneNumber?: string;
}

export interface SIMContextType {
  simCards: SIMCard[];
  renewalHistory: RenewalRecord[];
  walletDeposits: WalletDeposit[];
  externalExpenses: ExternalExpense[];
  role: UserRole;
  addSIMCard: (card: Omit<SIMCard, 'id'>) => void;
  updateSIMCard: (id: string, updates: Partial<SIMCard>) => void;
  deleteSIMCard: (id: string) => void;
  renewSIMCard: (id: string, paymentAmount: number) => void;
  addDeposit: (amount: number, note?: string) => void;
  addExternalExpense: (amount: number, description: string, phoneNumber?: string) => void;
  importSIMCards: (cards: SIMCard[]) => Promise<boolean>;
  setRole: (role: UserRole) => void; // For switching views
}
