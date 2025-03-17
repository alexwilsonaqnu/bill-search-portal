
interface ExtractedTextDisplayProps {
  text: string;
}

const ExtractedTextDisplay = ({ text }: ExtractedTextDisplayProps) => {
  if (!text) return null;
  
  // Check if this text contains indicators that it's from another state
  const isWisconsinBill = text.includes("Wisconsin") || text.includes("WI Legislature");
  const isOtherStateBill = text.includes("Minnesota") || text.includes("Michigan") || 
                           text.includes("Indiana") || text.includes("Iowa") || 
                           text.includes("Missouri") || text.includes("Kentucky");
  
  return (
    <div className="mt-4 p-4 bg-gray-50 border rounded-md overflow-auto max-h-[300px]">
      <h4 className="text-sm font-medium mb-2">Extracted Text:</h4>
      
      {(isWisconsinBill || isOtherStateBill) && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-md">
          <p className="text-amber-800 font-medium">⚠️ Warning: This appears to be a {isWisconsinBill ? "Wisconsin" : "non-Illinois"} bill</p>
          <p className="text-sm text-amber-700">The text below may be from the wrong state legislature. Please verify the bill source.</p>
        </div>
      )}
      
      <div className="whitespace-pre-wrap text-sm font-mono">
        {text}
      </div>
    </div>
  );
};

export default ExtractedTextDisplay;
