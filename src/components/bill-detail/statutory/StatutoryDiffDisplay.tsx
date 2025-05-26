
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatutoryAmendment, fetchCurrentStatuteText, generateTextDiff } from "@/services/statutoryAnalysis";
import { Loader2 } from "lucide-react";

interface StatutoryDiffDisplayProps {
  amendment: StatutoryAmendment | null;
}

const StatutoryDiffDisplay = ({ amendment }: StatutoryDiffDisplayProps) => {
  const [currentText, setCurrentText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!amendment) {
      setCurrentText(null);
      return;
    }

    const loadCurrentText = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const text = await fetchCurrentStatuteText(amendment.chapter, amendment.section);
        setCurrentText(text);
        
        if (!text) {
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

  if (isLoading) {
    return (
      <Card className="bg-white rounded-lg border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{amendment.citation}</CardTitle>
          <p className="text-sm text-gray-600">Statutory Changes</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading current statute text...</span>
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
        {error ? (
          <div className="text-center py-4">
            <div className="text-red-600 mb-2">{error}</div>
            <div className="text-sm text-gray-500 mb-4">
              Showing proposed text only:
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <ScrollArea className="h-64">
                <div className="prose max-w-none text-sm whitespace-pre-line">
                  {amendment.proposedText}
                </div>
              </ScrollArea>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Text Column */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                <h3 className="text-sm font-semibold text-gray-700">Current Statute</h3>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg">
                <ScrollArea className="h-64 p-4">
                  <div className="prose max-w-none text-sm whitespace-pre-line text-gray-800">
                    {currentText || "No current text available"}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Proposed Text Column */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                <h3 className="text-sm font-semibold text-gray-700">Proposed Changes</h3>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg">
                <ScrollArea className="h-64 p-4">
                  <div className="prose max-w-none text-sm whitespace-pre-line text-gray-800">
                    {amendment.proposedText}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatutoryDiffDisplay;
