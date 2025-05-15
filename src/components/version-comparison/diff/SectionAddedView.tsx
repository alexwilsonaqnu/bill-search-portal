
import React from "react";
import { BillSection } from "@/types";
import TextContentDisplay from "@/components/bill-detail/text/TextContentDisplay";
import { isHtmlContent, safeContentSize } from "../utils/contentUtils";

interface SectionAddedViewProps {
  section: BillSection;
}

const SectionAddedView = ({ section }: SectionAddedViewProps) => {
  const isHtml = isHtmlContent(section.content);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-400 mb-2">
          [Added in newer version]
        </h3>
        <div className="p-4 rounded-md bg-gray-50 border border-dashed border-gray-300 text-gray-400 italic">
          This section does not exist in the selected version
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-brand-primary mb-2">
          {section.title}
        </h3>
        <div className="rounded-md bg-green-50">
          {isHtml ? (
            <TextContentDisplay content={safeContentSize(section.content)} isHtml={true} />
          ) : (
            <div className="p-4">
              <p className="whitespace-pre-wrap">{safeContentSize(section.content)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SectionAddedView;
