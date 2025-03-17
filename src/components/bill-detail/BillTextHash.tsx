
interface BillTextHashProps {
  textHash: string;
}

const BillTextHash = ({ textHash }: BillTextHashProps) => {
  if (!textHash) return null;
  
  return (
    <div>
      <h3 className="font-semibold mb-2">Text Hash (MD5)</h3>
      <p className="text-sm text-gray-700 font-mono bg-gray-50 p-2 rounded border">
        {textHash}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        This MD5 hash represents the unique fingerprint of the bill's text content
      </p>
    </div>
  );
};

export default BillTextHash;
