
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { Bill } from "@/types";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BillUploaderProps {
  onBillsProcessed?: (bills: Bill[]) => void;
}

const BillUploader = ({ onBillsProcessed }: BillUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/json': ['.json']
    },
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      
      setIsUploading(true);
      setUploadedFiles([]);
      
      try {
        const uploadedFileNames: string[] = [];
        
        for (const file of acceptedFiles) {
          const reader = new FileReader();
          
          await new Promise<void>((resolve, reject) => {
            reader.onload = async () => {
              try {
                const base64Data = reader.result as string;
                
                const { data, error } = await supabase.functions.invoke("process-bills", {
                  body: { 
                    action: "upload",
                    fileName: file.name, 
                    fileContent: base64Data 
                  }
                });
                
                if (error) {
                  console.error("Error uploading file:", error);
                  toast.error(`Failed to upload ${file.name}: ${error.message}`);
                } else {
                  uploadedFileNames.push(file.name);
                  toast.success(`Uploaded ${file.name} successfully`);
                }
                resolve();
              } catch (error) {
                console.error("Error in file upload:", error);
                toast.error(`Failed to process ${file.name}`);
                resolve();  // Still resolve to continue with other files
              }
            };
            
            reader.onerror = () => {
              toast.error(`Failed to read ${file.name}`);
              resolve();  // Still resolve to continue with other files
            };
            
            reader.readAsDataURL(file);
          });
        }
        
        setUploadedFiles(uploadedFileNames);
        toast.success(`Uploaded ${uploadedFileNames.length} files successfully`);
      } catch (error) {
        console.error("Error in file upload process:", error);
        toast.error("Failed to upload files");
      } finally {
        setIsUploading(false);
      }
    }
  });

  const handleProcessFiles = async () => {
    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("process-bills", {
        body: { action: "process" }
      });
      
      if (error) {
        console.error("Error processing files:", error);
        toast.error(`Failed to process files: ${error.message}`);
      } else {
        console.log("Process response:", data);
        toast.success(`Processed ${data.message || "files"} successfully`);
        
        if (onBillsProcessed && data.results) {
          const processedBills = data.results
            .filter(result => result.success && result.bill)
            .map(result => result.bill);
          
          onBillsProcessed(processedBills);
        }
      }
    } catch (error) {
      console.error("Error in processing:", error);
      toast.error("Failed to process files");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleListFiles = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("process-bills", {
        body: { action: "list" }
      });
      
      if (error) {
        console.error("Error listing files:", error);
        toast.error(`Failed to list files: ${error.message}`);
      } else if (data.files) {
        const fileNames = data.files.map(file => file.name).join(", ");
        toast.info(`Files in storage: ${fileNames || "None"}`);
      }
    } catch (error) {
      console.error("Error in listing files:", error);
      toast.error("Failed to list files");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Bill Files</CardTitle>
        <CardDescription>
          Upload JSON files containing bill data to be processed and stored in the database.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"
          }`}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <p className="text-gray-500">Uploading files...</p>
          ) : isDragActive ? (
            <p className="text-blue-500">Drop the files here...</p>
          ) : (
            <div>
              <p className="text-gray-500 mb-2">Drag & drop JSON files here, or click to select files</p>
              <p className="text-xs text-gray-400">Only .json files are accepted</p>
            </div>
          )}
        </div>
        
        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Uploaded Files:</h4>
            <ul className="text-sm text-gray-500 space-y-1">
              {uploadedFiles.map((fileName, index) => (
                <li key={index} className="flex items-center">
                  <span className="mr-2">✓</span> {fileName}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="space-x-2">
          <Button variant="outline" onClick={handleListFiles} disabled={isProcessing || isUploading}>
            List Files
          </Button>
          <Button 
            onClick={handleProcessFiles} 
            disabled={isProcessing || isUploading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isProcessing ? "Processing..." : "Process All Files"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default BillUploader;
