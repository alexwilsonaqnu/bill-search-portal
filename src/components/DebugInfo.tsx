
import React, { useState } from "react";

interface DebugInfoProps {
  query: string;
  currentPage: number;
  dbStatus: string;
  storageStatus: string;
  buckets: string[];
  error: unknown;
  data?: {
    bills: any[];
    totalPages: number;
  };
}

const DebugInfo = ({ query, currentPage, dbStatus, storageStatus, buckets, error, data }: DebugInfoProps) => {
  const [expanded, setExpanded] = useState(false);
  
  // Check if the desired bucket is available
  const hasBucket = buckets.includes('103rd_General_Assembly');
  
  return (
    <div className="mb-6 p-4 bg-gray-100 rounded-lg text-xs text-left">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">Debug Info:</h3>
        <button 
          onClick={() => setExpanded(!expanded)} 
          className="text-blue-500 hover:text-blue-700"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>
      
      <div className={`${expanded ? "" : "h-16 overflow-hidden"} transition-all duration-300`}>
        <p className="mb-1">Query: "{query}", Page: {currentPage}</p>
        <p className="mb-1">DB Status: {dbStatus || 'Checking...'}</p>
        <div className="mb-1">
          <p>Storage Status:</p>
          <pre className="whitespace-pre-wrap bg-gray-200 p-2 rounded mt-1 text-xs">
            {storageStatus || 'Checking...'}
          </pre>
        </div>
        {buckets && buckets.length > 0 && (
          <div className="mb-1">
            <p>Available Buckets: {buckets.join(', ')}</p>
            {hasBucket ? (
              <p className="text-green-600 font-semibold">✅ Required bucket "103rd_General_Assembly" is available</p>
            ) : (
              <p className="text-red-600 font-semibold">❌ Required bucket "103rd_General_Assembly" is missing</p>
            )}
          </div>
        )}
        {error && (
          <div className="mb-1">
            <p className="text-red-500">Error:</p>
            <pre className="whitespace-pre-wrap bg-red-100 text-red-800 p-2 rounded mt-1 text-xs">
              {String(error)}
            </pre>
          </div>
        )}
        {data && <p>API Response: Bills count: {data.bills.length}, Total pages: {data.totalPages}</p>}
      </div>
    </div>
  );
};

export default DebugInfo;
