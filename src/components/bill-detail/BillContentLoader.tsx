
interface BillContentLoaderProps {
  ilgaUrl: string | null;
  setIsLoadingExternalContent: (isLoading: boolean) => void;
  isLoadingExternalContent: boolean;
  setExternalContent?: (content: string | null) => void;
}

const BillContentLoader = ({ 
  ilgaUrl, 
  setIsLoadingExternalContent,
  isLoadingExternalContent,
  setExternalContent
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
      
      // If setExternalContent is provided, use it to set the content
      if (setExternalContent) {
        const text = await response.text();
        setExternalContent(text);
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
