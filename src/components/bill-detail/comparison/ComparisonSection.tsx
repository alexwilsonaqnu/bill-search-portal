
import { BillVersion } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import VersionComparison from "@/components/VersionComparison";

interface ComparisonSectionProps {
  safeVersions: BillVersion[];
  refreshVersions: () => Promise<void>;
}

const ComparisonSection = ({ safeVersions, refreshVersions }: ComparisonSectionProps) => {
  if (!safeVersions.length) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
        <p className="text-gray-500">
          No versions available for this bill. Version comparison is not available.
        </p>
        <Button
          className="mt-4"
          variant="outline"
          size="sm"
          onClick={refreshVersions}
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh Versions
        </Button>
      </div>
    );
  }

  if (safeVersions.length === 1) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
        <p className="text-gray-500">
          This bill only has one version. Comparison is not available.
        </p>
        <Button
          className="mt-4"
          variant="outline"
          size="sm"
          onClick={refreshVersions}
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh Versions
        </Button>
      </div>
    );
  }

  return (
    <Tabs defaultValue="visual-diff" className="w-full">
      <TabsList className="w-full mb-4">
        <TabsTrigger value="visual-diff" className="flex-1">Visual Diff</TabsTrigger>
        <TabsTrigger value="side-by-side" className="flex-1">Side by Side</TabsTrigger>
      </TabsList>
      
      <TabsContent value="visual-diff" className="mt-0">
        <VersionComparison versions={safeVersions} displayMode="visual-diff" />
      </TabsContent>
      
      <TabsContent value="side-by-side" className="mt-0">
        <VersionComparison versions={safeVersions} displayMode="side-by-side" />
      </TabsContent>
    </Tabs>
  );
};

export default ComparisonSection;
