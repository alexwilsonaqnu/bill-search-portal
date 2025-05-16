
import React from "react";

interface LargeContentViewProps {
  leftTitle: string | null;
  rightTitle: string | null;
}

const LargeContentView = ({ leftTitle, rightTitle }: LargeContentViewProps) => {
  return (
    <div className="mb-8 border rounded-md overflow-hidden">
      <div className="p-3 bg-amber-100 flex justify-between items-center">
        <h3 className="font-medium">{leftTitle} → {rightTitle}</h3>
        <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded">Content Too Large</span>
      </div>
      <div className="p-4 bg-white">
        <p className="text-amber-700">
          This content is too large for visual diff comparison. Please use the side-by-side view instead.
        </p>
      </div>
    </div>
  );
};

export default LargeContentView;
