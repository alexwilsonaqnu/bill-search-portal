
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

// Helper function to check if content is from Illinois
export function isIllinoisContent(text: string): boolean {
  const ilKeywords = [
    'illinois general assembly',
    'ilga.gov',
    'il state',
    'illinois state',
    'illinois house',
    'illinois senate',
    'people of the state of illinois'
  ];
  
  const textLower = text.toLowerCase();
  return ilKeywords.some(keyword => textLower.includes(keyword));
}

// Helper function to decode base64 text
export function decodeBase64Text(base64Text: string): string {
  const decodedTextBytes = base64Decode(base64Text);
  return new TextDecoder().decode(decodedTextBytes);
}

// Check if the content is a PDF (starts with %PDF)
export function isPdfContent(text: string): boolean {
  return text.trim().startsWith('%PDF');
}
