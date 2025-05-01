
import { BillVersion } from "@/types";

export interface ComparisonProps {
  versions: BillVersion[];
  displayMode?: "side-by-side" | "visual-diff";
  className?: string;
}
