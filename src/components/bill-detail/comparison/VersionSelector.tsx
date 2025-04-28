
import { BillVersion } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VersionSelectorProps {
  versions: BillVersion[];
  selectedVersionId: string;
  label: string;
  onVersionChange: (versionId: string) => void;
}

const VersionSelector = ({ versions, selectedVersionId, label, onVersionChange }: VersionSelectorProps) => {
  return (
    <div>
      <h3 className="font-medium mb-2 text-gray-600">{label}</h3>
      <Select
        value={selectedVersionId}
        onValueChange={onVersionChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select version" />
        </SelectTrigger>
        <SelectContent>
          {versions.map((version) => (
            <SelectItem key={`${label}-${version.id}`} value={version.id}>
              {version.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default VersionSelector;
