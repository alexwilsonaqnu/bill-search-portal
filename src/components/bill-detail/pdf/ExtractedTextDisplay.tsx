
interface ExtractedTextDisplayProps {
  text: string;
}

const ExtractedTextDisplay = ({ text }: ExtractedTextDisplayProps) => {
  if (!text) return null;
  
  return (
    <div className="mt-4 p-4 bg-gray-50 border rounded-md overflow-auto max-h-[300px]">
      <h4 className="text-sm font-medium mb-2">Extracted Text:</h4>
      
      <div className="whitespace-pre-wrap text-sm font-mono">
        {text}
      </div>
    </div>
  );
};

export default ExtractedTextDisplay;
