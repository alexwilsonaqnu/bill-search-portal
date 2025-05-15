
import { Check } from "lucide-react";
import { BillVersion } from "@/types";

interface VersionHeaderProps {
  versionsLoaded: boolean;
  versions: BillVersion[];
  safeVersions: BillVersion[];
  hasLimitedVersions: boolean;
}

const VersionHeader = ({ versionsLoaded, versions, safeVersions, hasLimitedVersions }: VersionHeaderProps) => {
  return (
    <div className="flex items-center">
      {versionsLoaded && (
        <span className="flex items-center text-sm text-green-600 mr-4">
          <Check className="h-4 w-4 mr-1" /> Versions loaded
        </span>
      )}
      {hasLimitedVersions && (
        <span className="text-sm text-amber-600">
          Showing {safeVersions.length} of {versions?.length} versions
        </span>
      )}
    </div>
  );
};

export default VersionHeader;
