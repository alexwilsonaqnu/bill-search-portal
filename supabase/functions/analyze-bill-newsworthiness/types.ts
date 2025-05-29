
export interface BillAnalysisData {
  id: string;
  title: string;
  sponsor?: {
    name: string;
    party: string;
    role: string;
    district: string;
  };
  cosponsors?: any[];
  cosponsorCount: number;
  status?: string;
  statusDescription?: string;
  introducedDate?: string;
  lastActionDate?: string;
  lastUpdated?: string;
  sessionName?: string;
  sessionYear?: string;
  changes?: any[];
  changesCount: number;
  committeeActions?: any[];
  passedBothHouses?: boolean;
  data?: any;
  passChanceScore?: number; // From the pass chance analysis
  description?: string;
}

export interface NewsworthinessAnalysis {
  score: number;
  reasoning: string;
  factors: Array<{
    factor: string;
    impact: "positive" | "negative" | "neutral";
    description: string;
  }>;
}
