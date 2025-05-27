
import { useQuery } from "@tanstack/react-query";
import { Bill } from "@/types";
import { analyzeBillPassChance, PassChanceAnalysis } from "@/services/billPassAnalysisService";

interface UseBillPassAnalysisProps {
  bill: Bill;
  enabled?: boolean;
}

export function useBillPassAnalysis({ bill, enabled = true }: UseBillPassAnalysisProps) {
  return useQuery({
    queryKey: ["bill-pass-analysis", bill.id],
    queryFn: () => analyzeBillPassChance(bill),
    enabled: enabled && !!bill.id,
    retry: 1,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - analysis doesn't change frequently
    refetchOnWindowFocus: false,
  });
}
