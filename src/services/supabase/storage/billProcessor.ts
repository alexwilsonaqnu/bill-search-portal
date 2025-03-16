
import { Bill } from "@/types";
import { transformStorageBill } from "@/utils/billTransformUtils";
import { fetchFileFromBucket } from "./bucketOperations";

/**
 * Processes a JSON file from storage into a Bill object
 */
export async function processStorageFile(bucketName: string, filePath: string, fileName: string): Promise<Bill | null> {
  const fileData = await fetchFileFromBucket(bucketName, filePath);
  
  if (!fileData) {
    return null;
  }
  
  try {
    const text = await fileData.text();
    return transformStorageBill(fileName, text);
  } catch (error) {
    console.error(`Error processing ${fileName}:`, error);
    return null;
  }
}

/**
 * Helper function to process a batch of bill files
 */
export async function processBillFiles(bucketName: string, folderPath: string, jsonFiles: any[]): Promise<Bill[]> {
  const filesToProcess = jsonFiles.slice(0, 50); // Process up to 50 files
  const bills: Bill[] = [];
  
  for (const file of filesToProcess) {
    const filePath = folderPath ? `${folderPath}/${file.name}` : file.name;
    console.log(`Processing file: ${filePath} from bucket ${bucketName}`);
    
    const bill = await processStorageFile(bucketName, filePath, file.name);
    if (bill) {
      bills.push(bill);
    }
  }
  
  console.log(`Successfully processed ${bills.length} bills from "${bucketName}/${folderPath}"`);
  return bills;
}
