
import * as pdfjsLib from 'pdfjs-dist';
import { toast } from "sonner";

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Loads a PDF document from base64 data
 */
export const loadPdfFromBase64 = async (base64Data: string) => {
  try {
    // Remove the data URL prefix if present
    const pdfData = base64Data.includes('base64,') 
      ? atob(base64Data.split('base64,')[1])
      : atob(base64Data);
    
    // Convert binary string to array buffer
    const array = new Uint8Array(pdfData.length);
    for (let i = 0; i < pdfData.length; i++) {
      array[i] = pdfData.charCodeAt(i);
    }
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: array.buffer });
    const pdf = await loadingTask.promise;
    
    return pdf;
  } catch (error) {
    console.error("Error loading PDF:", error);
    toast.error("Failed to load PDF document");
    return null;
  }
};

/**
 * Renders a PDF page to a canvas
 */
export const renderPdfPage = async (pdfDocument: any, pageNumber: number, canvas: HTMLCanvasElement) => {
  if (!pdfDocument || !canvas) return;
  
  try {
    const page = await pdfDocument.getPage(pageNumber);
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    const viewport = page.getViewport({ scale: 1.5 });
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
  } catch (error) {
    console.error("Error rendering PDF page:", error);
    toast.error("Failed to render PDF page");
  }
};
