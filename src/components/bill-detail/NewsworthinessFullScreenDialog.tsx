
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Minimize, Loader2 } from "lucide-react";
import { Bill } from "@/types";

interface NewsworthinessAnalysis {
  score: number;
  reasoning: string;
  factors: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }>;
}

interface NewsworthinessFullScreenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: NewsworthinessAnalysis | null | undefined;
  isLoading: boolean;
  error: unknown;
  bill: Bill;
}

const NewsworthinessFullScreenDialog = ({
  isOpen,
  onClose,
  analysis,
  isLoading,
  error,
  bill
}: NewsworthinessFullScreenDialogProps) => {
  // Get newsworthiness color based on score
  const getNewsworthinessColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const newsworthyScore = analysis?.score || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Newsworthiness Analysis</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClose}
            className="flex items-center gap-1"
          >
            <Minimize className="h-4 w-4" /> Exit Full Screen
          </Button>
        </div>

        <div className="h-[75vh] overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-green-500 mr-3" />
              <span className="text-lg">Analyzing newsworthiness...</span>
            </div>
          ) : analysis ? (
            <div className="space-y-8">
              {/* Header with bill title and score */}
              <div className="text-center space-y-4">
                <h3 className="text-xl font-medium text-gray-800">{bill.title}</h3>
                <div className="flex justify-center">
                  <div className="border border-green-300 rounded-lg p-6 bg-white text-center">
                    <p className={`text-6xl font-bold ${getNewsworthinessColor(newsworthyScore)}`}>
                      {newsworthyScore}
                    </p>
                    <p className={`text-lg ${getNewsworthinessColor(newsworthyScore)} mt-2`}>
                      Newsworthy Score
                    </p>
                  </div>
                </div>
              </div>

              {/* Reasoning section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4 text-gray-800">Analysis Summary</h4>
                <p className="text-gray-700 leading-relaxed text-base">
                  {analysis.reasoning}
                </p>
              </div>

              {/* Factors breakdown */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-800">Contributing Factors</h4>
                <div className="grid gap-4">
                  {analysis.factors.map((factor, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                      <div className="flex items-start gap-3">
                        <span className={`text-xl mt-1 flex-shrink-0 ${
                          factor.impact === 'positive' ? 'text-green-500' : 
                          factor.impact === 'negative' ? 'text-red-500' : 
                          'text-gray-500'
                        }`}>
                          {factor.impact === 'positive' ? '↗' : factor.impact === 'negative' ? '↘' : '→'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-medium text-gray-800 capitalize">
                              {factor.factor.replace(/_/g, ' ')}
                            </h5>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              factor.impact === 'positive' ? 'bg-green-100 text-green-700' : 
                              factor.impact === 'negative' ? 'bg-red-100 text-red-700' : 
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {factor.impact}
                            </span>
                          </div>
                          <p className="text-gray-600 leading-relaxed">
                            {factor.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <p className="text-lg text-gray-600">Analysis unavailable</p>
                <p className="text-sm text-gray-500">Please try again later.</p>
                {error && (
                  <p className="text-sm text-red-600">Error: {String(error)}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewsworthinessFullScreenDialog;
