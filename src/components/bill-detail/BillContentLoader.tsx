
interface BillContentLoaderProps {
  ilgaUrl: string | null;
  setIsLoadingExternalContent: (isLoading: boolean) => void;
  isLoadingExternalContent: boolean;
}

const BillContentLoader = ({ 
  ilgaUrl, 
  setIsLoadingExternalContent,
  isLoadingExternalContent
}: BillContentLoaderProps) => {
  
  // Function to fetch the content from ILGA website
  const fetchExternalContent = async () => {
    if (!ilgaUrl) {
      console.error("No external URL found for this bill");
      return;
    }
    
    setIsLoadingExternalContent(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-content?url=${encodeURIComponent(ilgaUrl)}`);
      
      if (!response.ok) {
        console.error("Failed to fetch content:", response.statusText);
        throw new Error(`Failed to load content: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching content:", error);
      throw error;
    } finally {
      setIsLoadingExternalContent(false);
    }
  };
  
  return { fetchExternalContent };
};

export default BillContentLoader;
