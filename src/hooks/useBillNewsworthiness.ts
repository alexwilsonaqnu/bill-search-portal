
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
    queryFn: () => analyzeBillNewsworthiness(bill, passChanceScore),
    enabled: enabled && !!bill.id,
    retry: 1,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - newsworthiness doesn't change frequently
    refetchOnWindowFocus: false,
  });
}
