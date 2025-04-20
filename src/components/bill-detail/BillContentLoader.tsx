
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface BillContentLoaderProps {
  ilgaUrl: string | null;
  setExternalContent: (content: string | null) => void;
  setIsLoadingExternalContent: (isLoading: boolean) => void;
  isLoadingExternalContent: boolean;
}

const BillContentLoader = ({ 
  ilgaUrl, 
  setExternalContent, 
  setIsLoadingExternalContent,
  isLoadingExternalContent
}: BillContentLoaderProps) => {
  
  // Function to fetch the content from ILGA website
  const fetchExternalContent = async () => {
    if (!ilgaUrl) {
      toast.error("No external URL found for this bill");
      return;
    }
    
    setIsLoadingExternalContent(true);
    toast.info("Fetching bill text from ILGA website...");
    
    try {
      // We need to use a proxy to bypass CORS restrictions
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-content?url=${encodeURIComponent(ilgaUrl)}`);
      
      if (response.ok) {
        const text = await response.text();
        setExternalContent(text);
        toast.success("Successfully loaded bill text");
      } else {
        console.error("Failed to fetch content:", response.statusText);
        toast.error(`Failed to load content: ${response.statusText}`);
        setExternalContent(`Failed to load content from ${ilgaUrl}`);
      }
    } catch (error) {
      console.error("Error fetching content:", error);
      toast.error(`Error fetching content: ${error instanceof Error ? error.message : String(error)}`);
      setExternalContent(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingExternalContent(false);
    }
  };
  
  return { fetchExternalContent };
};

export default BillContentLoader;
