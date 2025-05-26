
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatutoryAmendment } from "@/services/statutoryAnalysis";

interface AmendmentsIndexProps {
  amendments: StatutoryAmendment[];
  selectedAmendment: string | null;
  onSelectAmendment: (amendmentId: string) => void;
}

const AmendmentsIndex = ({ amendments, selectedAmendment, onSelectAmendment }: AmendmentsIndexProps) => {
  if (amendments.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white rounded-lg border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Amended Sections</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-48">
          <div className="p-3 space-y-2">
            {amendments.map((amendment) => (
              <button
                key={amendment.id}
                onClick={() => onSelectAmendment(amendment.id)}
                className={`w-full text-left p-2 rounded text-sm transition-colors ${
                  selectedAmendment === amendment.id
                    ? "bg-[#35B7CD] text-white"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div className="font-medium">{amendment.citation}</div>
                <div className="text-xs opacity-75 truncate">
                  Chapter {amendment.chapter}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AmendmentsIndex;
