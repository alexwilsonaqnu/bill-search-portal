import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatutoryAmendment, fetchCurrentStatuteText } from "@/services/statutoryAnalysis";
import { Loader2 } from "lucide-react";
import { diffWords } from "diff";

interface StatutoryDiffDisplayProps {
  amendment: StatutoryAmendment | null;
}

const StatutoryDiffDisplay = ({ amendment }: StatutoryDiffDisplayProps) => {
  const [currentText, setCurrentText] = useState<string | null>(null);
  const [diffElements, setDiffElements] = useState<JSX.Element[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!amendment) {
      setCurrentText(null);
      setDiffElements([]);
      return;
    }

    const loadCurrentText = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const text = await fetchCurrentStatuteText(amendment.chapter, amendment.section);
        setCurrentText(text);
        
        if (text) {
          // Generate word-level diff
          const changes = diffWords(text, amendment.proposedText);
          
          // Convert diff to JSX elements, only highlighting changes
          const elements = changes.map((change, index) => {
            if (change.added) {
              return (
                <span key={index} className="bg-green-100 text-green-800 px-1">
                  {change.value}
                </span>
              );
            } else if (change.removed) {
              return (
                <span key={index} className="bg-red-100 text-red-800 line-through px-1">
                  {change.value}
                </span>
              );
            } else {
              // Unchanged text - no highlighting
              return (
                <span key={index}>
                  {change.value}
                </span>
              );
            }
          });
          
          setDiffElements(elements);
        } else {
          setError("Current statute text not found in database");
        }
      } catch (err) {
        console.error("Error loading current statute text:", err);
        setError("Failed to load current statute text");
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrentText();
  }, [amendment]);

  if (!amendment) {
    return (
      <Card className="bg-white rounded-lg border shadow-sm">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Select an amended section from the index to view changes
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{amendment.citation}</CardTitle>
        <p className="text-sm text-gray-600">Statutory Changes</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading current statute text...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">{error}</div>
            <div className="text-sm text-gray-500">
              Showing proposed text only:
            </div>
            <ScrollArea className="h-64 mt-4">
              <div className="prose max-w-none text-sm whitespace-pre-line">
                {amendment.proposedText}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="prose max-w-none text-sm">
              <div className="mb-4 text-xs text-gray-600">
                <span className="inline-block w-4 h-4 bg-red-100 border border-red-200 mr-2"></span>
                Deletions
                <span className="inline-block w-4 h-4 bg-green-100 border border-green-200 mr-2 ml-4"></span>
                Additions
              </div>
              <div className="font-mono text-xs leading-relaxed whitespace-pre-wrap">
                {diffElements}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default StatutoryDiffDisplay;
