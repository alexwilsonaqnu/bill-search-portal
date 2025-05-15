
import { BillVersion } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VersionSelectorProps {
  versions: BillVersion[];
  leftVersionId: string;
  rightVersionId: string;
  setLeftVersionId: (id: string) => void;
  setRightVersionId: (id: string) => void;
}

const VersionSelector = ({
  versions,
  leftVersionId,
  rightVersionId,
  setLeftVersionId,
  setRightVersionId
}: VersionSelectorProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div>
        <h3 className="font-medium mb-2 text-gray-600">Version 1</h3>
        <Select
          value={leftVersionId}
          onValueChange={setLeftVersionId}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select version" />
          </SelectTrigger>
          <SelectContent>
            {versions.map((version) => (
              <SelectItem key={`left-${version.id}`} value={version.id}>
                {version.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <h3 className="font-medium mb-2 text-gray-600">Version 2</h3>
        <Select
          value={rightVersionId}
          onValueChange={setRightVersionId}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select version" />
          </SelectTrigger>
          <SelectContent>
            {versions.map((version) => (
              <SelectItem key={`right-${version.id}`} value={version.id}>
                {version.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default VersionSelector;
