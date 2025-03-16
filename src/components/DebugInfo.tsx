
import React from "react";

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
  return (
    <div className="mb-6 p-4 bg-gray-100 rounded-lg text-xs text-left">
      <h3 className="font-semibold mb-1">Debug Info:</h3>
      <p className="mb-1">Query: "{query}", Page: {currentPage}</p>
      <p className="mb-1">DB Status: {dbStatus || 'Checking...'}</p>
      <p className="mb-1">Storage Status: {storageStatus || 'Checking...'}</p>
      {buckets && buckets.length > 0 && (
        <p className="mb-1">Available Buckets: {buckets.join(', ')}</p>
      )}
      {error && <p className="text-red-500">Error: {String(error)}</p>}
      {data && <p>API Response: Bills count: {data.bills.length}, Total pages: {data.totalPages}</p>}
    </div>
  );
};

export default DebugInfo;
