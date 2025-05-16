
import React from "react";

interface ModifiedContentViewProps {
  leftTitle: string | null;
  rightTitle: string | null;
  changes: any[];
}

const ModifiedContentView = ({ leftTitle, rightTitle, changes }: ModifiedContentViewProps) => {
  return (
    <div className="mb-8 border rounded-md overflow-hidden">
      <div className="p-3 bg-yellow-100 flex justify-between items-center">
        <h3 className="font-medium">{leftTitle} → {rightTitle}</h3>
        <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">Modified</span>
      </div>
      <div className="p-4 bg-white">
        <div className="whitespace-pre-wrap font-mono text-sm">
          {changes?.map((part, index) => {
            const className = part.added 
              ? "bg-green-100 text-green-800" 
              : part.removed 
                ? "bg-red-100 text-red-800 line-through" 
                : "";
            return (
              <span key={index} className={className}>
                {part.value}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ModifiedContentView;
