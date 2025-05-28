
export interface BillAnalysisData {
  id: string;
  title?: string;
  sponsor?: {
    name: string;
    party?: string;
    role?: string;
    district?: string;
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
  changes?: Array<{
    action?: string;
    description?: string;
    date?: string;
    details?: string;
  }>;
  changesCount: number;
  committeeActions?: any[];
  passedBothHouses: boolean;
  data?: any;
}

export interface PassChanceAnalysis {
  score: number;
  reasoning: string;
  factors: Array<{
    factor: string;
    impact: "positive" | "negative" | "neutral";
    description: string;
  }>;
}

export interface RulesReferralResult {
  hasRulesReferral: boolean;
  description: string;
  daysSinceReferral?: number;
}
