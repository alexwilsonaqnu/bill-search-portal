
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";

interface BillTextUploaderProps {
  billId: string;
  onUploadComplete?: (content: string) => void;
}

const BillTextUploader = ({ billId, onUploadComplete }: BillTextUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'text/html': ['.html', '.htm']
    },
    multiple: false,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      
      setIsUploading(true);
      setUploadProgress(10);
      
      try {
        const file = acceptedFiles[0];
        const reader = new FileReader();
        
        reader.onload = async (event) => {
          try {
            const content = event.target?.result as string;
            setUploadProgress(50);
            
            // Determine the format based on file extension
            const fileExt = file.name.split('.').pop()?.toLowerCase();
            const format = fileExt === 'csv' ? 'csv' : 
                           fileExt === 'htm' || fileExt === 'html' ? 'html' : 'text';
            
            // Call the Supabase Edge Function to process and store the text
            const { data, error } = await supabase.functions.invoke("upload-bill-text", {
              body: { 
                billId, 
                textContent: content,
                format 
              }
            });
            
            if (error) {
              console.error("Error uploading text:", error);
              toast.error(`Failed to upload bill text: ${error.message}`);
            } else {
              setUploadProgress(100);
              toast.success(`Successfully uploaded text for bill ${billId}`);
              
              if (onUploadComplete) {
                onUploadComplete(content);
              }
            }
          } catch (error) {
            console.error("Error processing text upload:", error);
            toast.error(`Failed to process text: ${error instanceof Error ? error.message : String(error)}`);
          } finally {
            setIsUploading(false);
          }
        };
        
        reader.onerror = () => {
          toast.error(`Failed to read file: ${file.name}`);
          setIsUploading(false);
        };
        
        reader.readAsText(file);
      } catch (error) {
        console.error("Error in file upload process:", error);
        toast.error("Failed to upload file");
        setIsUploading(false);
      }
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Upload Bill Text</CardTitle>
        <CardDescription>
          Upload the bill text from a TXT, CSV, or HTML file.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"
          }`}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500 mb-2" />
              <p className="text-sm text-gray-500">Uploading file... {uploadProgress}%</p>
            </div>
          ) : isDragActive ? (
            <p className="text-blue-500">Drop the file here...</p>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto text-gray-400" />
              <p className="text-sm text-gray-500">Drag & drop a file here, or click to select</p>
              <p className="text-xs text-gray-400">Accepts .txt, .csv, .html, and .htm files</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BillTextUploader;
