
import { useQuery } from "@tanstack/react-query";
import { Bill } from "@/types";
import { analyzeBillNewsworthiness, NewsworthinessAnalysis } from "@/services/billNewsworthinessService";

interface UseBillNewsworthinessProps {
  bill: Bill;
  passChanceScore?: number;
  enabled?: boolean;
}

export function useBillNewsworthiness({ bill, passChanceScore, enabled = true }: UseBillNewsworthinessProps) {
  return useQuery({
    queryKey: ["bill-newsworthiness", bill.id, passChanceScore],
    queryFn: async () => {
      console.log("useBillNewsworthiness: Starting analysis for bill", bill.id);
      const result = await analyzeBillNewsworthiness(bill, passChanceScore);
      console.log("useBillNewsworthiness: Analysis result", result);
      return result;
    },
    enabled: enabled && !!bill.id && !!bill.title,
    retry: 2,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
  });
}
