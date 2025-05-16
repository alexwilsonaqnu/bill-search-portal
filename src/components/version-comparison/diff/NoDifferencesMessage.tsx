
import React from "react";

const NoDifferencesMessage = () => {
  return (
    <div className="p-4 border rounded-md bg-gray-50 text-center">
      <p className="text-muted-foreground">No differences found between selected versions.</p>
    </div>
  );
};

export default NoDifferencesMessage;
