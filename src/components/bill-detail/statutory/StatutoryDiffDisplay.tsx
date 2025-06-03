
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatutoryAmendment } from "@/services/statutoryAnalysis";
import { Loader2 } from "lucide-react";

interface StatutoryDiffDisplayProps {
  amendment: StatutoryAmendment | null;
}

const StatutoryDiffDisplay = ({ amendment }: StatutoryDiffDisplayProps) => {
  const [processedContent, setProcessedContent] = useState<JSX.Element[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!amendment) {
      setProcessedContent([]);
      return;
    }

    setIsLoading(true);
    
    // Process the proposed text to extract additions and deletions
    const processStatutoryText = (text: string): JSX.Element[] => {
      const elements: JSX.Element[] = [];
      let currentIndex = 0;
      
      // Split text into lines for better processing
      const lines = text.split('\n');
      
      lines.forEach((line, lineIndex) => {
        const lineElements: JSX.Element[] = [];
        let lineText = line;
        let elementIndex = 0;
        
        // Process underlined text (additions) - look for <u> tags or similar markup
        const underlineRegex = /<u[^>]*>(.*?)<\/u>/gi;
        let match;
        let lastIndex = 0;
        
        while ((match = underlineRegex.exec(lineText)) !== null) {
          // Add text before the underlined section
          if (match.index > lastIndex) {
            const beforeText = lineText.substring(lastIndex, match.index);
            if (beforeText) {
              lineElements.push(
                <span key={`${lineIndex}-${elementIndex++}`}>
                  {beforeText}
                </span>
              );
            }
          }
          
          // Add the underlined (addition) text
          lineElements.push(
            <span key={`${lineIndex}-${elementIndex++}`} className="bg-green-100 text-green-800 px-1 rounded">
              {match[1]}
            </span>
          );
          
          lastIndex = match.index + match[0].length;
        }
        
        // Reset regex and process strikethrough text (deletions)
        const strikeRegex = /<(s|strike|del)[^>]*>(.*?)<\/(s|strike|del)>/gi;
        let remainingText = lastIndex === 0 ? lineText : lineText.substring(lastIndex);
        let strikeMatch;
        let strikeLastIndex = 0;
        
        while ((strikeMatch = strikeRegex.exec(remainingText)) !== null) {
          // Add text before the strikethrough section
          if (strikeMatch.index > strikeLastIndex) {
            const beforeText = remainingText.substring(strikeLastIndex, strikeMatch.index);
            if (beforeText) {
              lineElements.push(
                <span key={`${lineIndex}-${elementIndex++}`}>
                  {beforeText}
                </span>
              );
            }
          }
          
          // Add the strikethrough (deletion) text
          lineElements.push(
            <span key={`${lineIndex}-${elementIndex++}`} className="bg-red-100 text-red-800 line-through px-1 rounded">
              {strikeMatch[2]}
            </span>
          );
          
          strikeLastIndex = strikeMatch.index + strikeMatch[0].length;
        }
        
        // Add any remaining text
        if (lastIndex === 0 && strikeLastIndex === 0) {
          // No special formatting found, add the whole line
          lineElements.push(
            <span key={`${lineIndex}-${elementIndex++}`}>
              {lineText}
            </span>
          );
        } else if (strikeLastIndex < remainingText.length) {
          lineElements.push(
            <span key={`${lineIndex}-${elementIndex++}`}>
              {remainingText.substring(strikeLastIndex)}
            </span>
          );
        }
        
        // Add the line with a line break
        elements.push(
          <div key={lineIndex} className="mb-1">
            {lineElements}
          </div>
        );
      });
      
      return elements;
    };
    
    const elements = processStatutoryText(amendment.proposedText);
    setProcessedContent(elements);
    setIsLoading(false);
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
            <span className="ml-2">Processing statutory changes...</span>
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
              <div className="font-mono text-xs leading-relaxed">
                {processedContent}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default StatutoryDiffDisplay;
