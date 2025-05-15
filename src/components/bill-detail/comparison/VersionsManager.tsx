
import { useState, useEffect } from "react";
import { Bill, BillVersion } from "@/types";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Check } from "lucide-react";
import { toast } from "sonner";
import { fetchBillVersions } from "@/services/legiscan/fetchVersions";

interface VersionsManagerProps {
  bill: Bill;
  legiscanBillId: string | null;
  state: string;
  setVersions: (versions: BillVersion[]) => void;
  setVersionsLoaded: (loaded: boolean) => void;
}

const VersionsManager = ({ bill, legiscanBillId, state, setVersions, setVersionsLoaded }: VersionsManagerProps) => {
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);

  // Fetch versions when the component mounts or bill changes
  useEffect(() => {
    loadVersions();
  }, [bill.id, legiscanBillId, state, bill.versions]);

  const loadVersions = async () => {
    if (!legiscanBillId) {
      console.warn("Cannot load versions: No LegiScan bill ID available");
      return;
    }
    
    setIsLoadingVersions(true);
    
    try {
      console.log(`Fetching versions for bill ${legiscanBillId} (${state})`);
      const fetchedVersions = await fetchBillVersions(legiscanBillId, state);
      
      if (fetchedVersions.length > 0) {
        // Validate that versions have content
        const versionsWithContent = fetchedVersions.filter(version =>
          version.sections && version.sections.some(section => 
            section.content && section.content.trim().length > 0
          )
        );
        
        console.log(`Fetched ${fetchedVersions.length} versions, ${versionsWithContent.length} with content`);
        
        if (versionsWithContent.length > 0) {
          setVersions(fetchedVersions);
          setVersionsLoaded(true);
          toast.success(`Loaded ${versionsWithContent.length} versions with content`);
        } else {
          // If no versions with content, try one more time
          console.warn("No versions with content found, trying one more time");
          const retryVersions = await fetchBillVersions(legiscanBillId, state);
          if (retryVersions.length > 0) {
            setVersions(retryVersions);
            setVersionsLoaded(true);
            
            // Check content in retried versions
            const retryWithContent = retryVersions.filter(version =>
              version.sections && version.sections.some(section => 
                section.content && section.content.trim().length > 0
              )
            );
            
            if (retryWithContent.length > 0) {
              toast.success(`Loaded ${retryWithContent.length} versions with content`);
            } else {
              toast.warning("Versions loaded but may have limited content");
            }
          }
        }
      } else {
        // If no versions found and we already have some in the bill object, use those
        if (bill.versions && bill.versions.length > 0) {
          console.log("Using existing versions from bill object");
          setVersions(bill.versions);
        } else {
          toast.warning("No versions available for this bill");
        }
      }
    } catch (error) {
      console.error("Failed to load bill versions:", error);
      toast.error("Failed to load bill versions");
      
      // Fallback to existing versions if available
      if (bill.versions && bill.versions.length > 0) {
        setVersions(bill.versions);
      }
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const refreshVersions = async () => {
    if (!legiscanBillId) {
      toast.error("Cannot refresh versions: No bill ID available");
      return;
    }
    
    setIsLoadingVersions(true);
    try {
      const refreshedVersions = await fetchBillVersions(legiscanBillId, state);
      if (refreshedVersions.length > 0) {
        setVersions(refreshedVersions);
        setVersionsLoaded(true);
        toast.success(`Refreshed ${refreshedVersions.length} versions`);
      } else {
        toast.info("No versions found for this bill");
      }
    } catch (error) {
      console.error("Error refreshing versions:", error);
      toast.error("Failed to refresh versions");
    } finally {
      setIsLoadingVersions(false);
    }
  };

  return (
    <Button
      onClick={refreshVersions}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
      disabled={isLoadingVersions}
    >
      <RefreshCcw className={`h-4 w-4 ${isLoadingVersions ? 'animate-spin' : ''}`} />
      {isLoadingVersions ? "Loading..." : "Refresh Versions"}
    </Button>
  );
};

export default VersionsManager;
