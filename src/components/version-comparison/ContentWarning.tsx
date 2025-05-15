
import React from "react";
import { AlertCircle } from "lucide-react";

interface ContentWarningProps {
  warning: string;
}

const ContentWarning = ({ warning }: ContentWarningProps) => {
  if (!warning) return null;
  
  return (
    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm flex items-start">
      <AlertCircle className="text-amber-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-amber-800">Content Warning</p>
        <p className="text-amber-700">{warning}</p>
      </div>
    </div>
  );
};

export default ContentWarning;
