import { supabase } from "@/integrations/supabase/client";

export interface StatutoryAmendment {
  id: string;
  citation: string;
  chapter: string;
  section: string;
  proposedText: string;
  currentText?: string;
  diffHtml?: string;
}

/**
 * Detects if a bill amends Illinois Compiled Statutes
 */
export function detectStatutoryAmendments(billText: string): boolean {
  const amendmentPhrases = [
    "changing section",
    "amending section", 
    "by changing section",
    "by amending section",
    "is amended by changing",
    "is amended by adding",
    "is amended by deleting"
  ];
  
  const lowerText = billText.toLowerCase();
  const hasAmendmentPhrase = amendmentPhrases.some(phrase => lowerText.includes(phrase));
  const hasILCS = lowerText.includes('ilcs');
  
  console.log('Bill text length:', billText.length);
  console.log('Has amendment phrase:', hasAmendmentPhrase);
  console.log('Has ILCS:', hasILCS);
  console.log('Sample text:', billText.substring(0, 500));
  
  return hasAmendmentPhrase && hasILCS;
}

/**
 * Strips HTML tags while preserving formatting semantics and document structure for statutory changes
 */
function stripHtmlAndPreserveFormatting(htmlText: string): string {
  // First, remove the underlined and strikethrough content but preserve the actual text content
  // We don't want to mark additions/deletions here since the diff generator will handle that
  let text = htmlText.replace(/<u[^>]*>(.*?)<\/u>/gi, '$1');
  text = text.replace(/<s[^>]*>(.*?)<\/s>/gi, '$1');
  text = text.replace(/<strike[^>]*>(.*?)<\/strike>/gi, '$1');
  text = text.replace(/<del[^>]*>(.*?)<\/del>/gi, '$1');
  
  // Convert structural HTML elements to line breaks to preserve document structure
  text = text.replace(/<\/?(p|div|section|article|h[1-6])[^>]*>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/?(li|ul|ol)[^>]*>/gi, '\n');
  text = text.replace(/<\/?(tr|td|th)[^>]*>/gi, '\n');
  
  // Replace common HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  
  // Remove remaining HTML tags (styling, scripts, etc.) but preserve the text content
  text = text.replace(/<script[^>]*>.*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>.*?<\/style>/gi, '');
  text = text.replace(/<[^>]*>/g, ' ');
  
  // Clean up extra whitespace but preserve line breaks
  text = text.replace(/[ \t]+/g, ' '); // Replace multiple spaces/tabs with single space
  text = text.replace(/\n\s+/g, '\n'); // Remove spaces at beginning of lines
  text = text.replace(/\s+\n/g, '\n'); // Remove spaces at end of lines
  text = text.replace(/\n{3,}/g, '\n\n'); // Replace multiple consecutive line breaks with double
  
  // Remove standalone numbers that appear between lines (these are often line numbers from HTML tables)
  text = text.replace(/\n\s*\d+\s*\n/g, '\n');
  text = text.replace(/^\s*\d+\s*\n/g, ''); // Remove numbers at start
  text = text.replace(/\n\s*\d+\s*$/g, ''); // Remove numbers at end
  
  text = text.trim();
  
  return text;
}

/**
 * Extracts ILCS citations and amendment text from bill content
 */
export function extractAmendments(billText: string): StatutoryAmendment[] {
  const amendments: StatutoryAmendment[] = [];
  
  // First, strip HTML and preserve formatting semantics
  const cleanText = stripHtmlAndPreserveFormatting(billText);
  console.log('Clean text length:', cleanText.length);
  console.log('Clean text sample:', cleanText.substring(0, 500));
  
  // More flexible approach: look for ILCS patterns throughout the text
  // and capture context around them
  const ilcsPattern = /(\d+)\s+ILCS\s+([\d\/\-\.]+)/gi;
  const amendmentKeywords = /(?:changing|amending|amended|by changing|by amending|is amended)/gi;
  
  let match;
  let amendmentCounter = 0;
  
  console.log('Starting pattern-based extraction...');
  
  // Find all ILCS citations first
  while ((match = ilcsPattern.exec(cleanText)) !== null) {
    const fullMatch = match[0];
    const chapter = match[1];
    const section = match[2];
    const matchStart = match.index;
    const matchEnd = match.index + fullMatch.length;
    
    console.log(`Found ILCS citation: ${fullMatch} at position ${matchStart}`);
    
    // Look for amendment keywords in a window around this ILCS citation
    const windowStart = Math.max(0, matchStart - 200);
    const windowEnd = Math.min(cleanText.length, matchEnd + 200);
    const contextWindow = cleanText.substring(windowStart, windowEnd);
    
    // Check if amendment keywords appear in this context
    if (amendmentKeywords.test(contextWindow)) {
      amendmentCounter++;
      console.log(`Amendment context found for ${fullMatch}`);
      
      // Extract proposed text - look for text after the ILCS citation
      // until we hit another section or the end
      const afterCitation = cleanText.substring(matchEnd);
      const lines = afterCitation.split('\n');
      
      let proposedText = '';
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Stop if we hit another section or legislative marker
        if (line.match(/^Section \d+/i) || 
            line.match(/^\d+ ILCS/i) ||
            line.length === 0) {
          break;
        }
        
        proposedText += line + '\n';
        
        // Limit to reasonable length
        if (proposedText.length > 2000) {
          break;
        }
      }
      
      if (proposedText.trim().length > 0) {
        const amendment: StatutoryAmendment = {
          id: `amendment-${amendmentCounter}`,
          citation: `${chapter} ILCS ${section}`,
          chapter,
          section,
          proposedText: proposedText.trim()
        };
        
        amendments.push(amendment);
        console.log(`Created amendment: ${amendment.citation}, text length: ${amendment.proposedText.length}`);
      }
    }
    
    // Reset regex position to continue searching
    amendmentKeywords.lastIndex = 0;
  }
  
  console.log('Extracted', amendments.length, 'amendments');
  amendments.forEach(a => console.log('Amendment:', a.citation, 'Text length:', a.proposedText.length));
  
  return amendments;
}

/**
 * Fetches current statute text from ILCS storage bucket
 */
export async function fetchCurrentStatuteText(chapter: string, section: string): Promise<string | null> {
  try {
    console.log(`Fetching current statute text for ${chapter} ILCS ${section}`);
    
    // Try to list buckets, but continue even if this fails
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.warn('Warning: Could not list buckets:', bucketsError);
    } else {
      console.log('Available buckets:', buckets?.map(b => b.name) || []);
    }
    
    const fileName = `${chapter}ILCS.json`;
    console.log(`Attempting to download file: ${fileName} from ilcs bucket`);
    
    // Try to download the JSON file directly - the bucket might exist even if we can't list it
    const { data, error } = await supabase.storage
      .from('ilcs')
      .download(fileName);
    
    if (error) {
      console.error(`Error downloading ${fileName}:`, error);
      
      // Let's try to list files in the bucket to see what's available
      const { data: files, error: listError } = await supabase.storage
        .from('ilcs')
        .list('', { limit: 100 });
        
      if (listError) {
        console.error('Error listing files in ilcs bucket:', listError);
        console.log('This might mean the bucket does not exist or you do not have access to it.');
        console.log('Please ensure:');
        console.log('1. The "ilcs" bucket exists in your Supabase storage');
        console.log('2. The bucket has public read access or appropriate RLS policies');
        console.log('3. Your ILCS JSON files are uploaded to the bucket');
      } else {
        console.log('Files in ilcs bucket:', files?.map(f => f.name) || []);
        if (files && files.length === 0) {
          console.log('The ilcs bucket exists but is empty. Please upload your ILCS JSON files.');
        }
      }
      
      return null;
    }
    
    if (!data) {
      console.error(`No data returned for ${fileName}`);
      return null;
    }
    
    console.log(`Successfully downloaded ${fileName}, size: ${data.size} bytes`);
    
    const text = await data.text();
    console.log(`File content length: ${text.length} characters`);
    console.log(`File content preview: ${text.substring(0, 200)}...`);
    
    let ilcsData;
    try {
      ilcsData = JSON.parse(text);
      console.log('JSON parsed successfully');
      console.log('Top-level keys in JSON:', Object.keys(ilcsData));
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      return null;
    }
    
    // Look for the specific section - try different approaches
    console.log(`Looking for section ${section} in chapter ${chapter}`);
    
    // Helper function to extract text from section data
    const extractSectionText = (sectionData: any): string | null => {
      if (typeof sectionData === 'string') {
        return sectionData;
      }
      if (typeof sectionData === 'object' && sectionData !== null) {
        // Try common text field names
        return sectionData.text || sectionData.content || sectionData.body || null;
      }
      return null;
    };
    
    // Approach 1: Look for chapter key first, then section within it
    const chapterKey = `${chapter}ILCS${section.split('/')[0]}`;
    console.log(`Trying chapter key: ${chapterKey}`);
    
    if (ilcsData[chapterKey]) {
      console.log(`Found chapter data under key: ${chapterKey}`);
      const chapterData = ilcsData[chapterKey];
      
      // Look for the full section reference
      const fullSectionKey = `${chapter}ILCS${section}`;
      console.log(`Looking for full section key: ${fullSectionKey}`);
      
      if (chapterData[fullSectionKey]) {
        console.log(`Found section under full key: ${fullSectionKey}`);
        const sectionText = extractSectionText(chapterData[fullSectionKey]);
        if (sectionText) {
          console.log(`Successfully extracted text, length: ${sectionText.length}`);
          return sectionText;
        }
      }
      
      // Also try just the section part (like "140/4")
      console.log(`Trying section key: ${section}`);
      if (chapterData[section]) {
        console.log(`Found section under key: ${section}`);
        const sectionText = extractSectionText(chapterData[section]);
        if (sectionText) {
          console.log(`Successfully extracted text, length: ${sectionText.length}`);
          return sectionText;
        }
      }
      
      // Try all keys in the chapter to find a match
      console.log('Trying all keys in chapter for pattern matching...');
      for (const key in chapterData) {
        if (key.includes(section) || key.endsWith(`/${section.split('/')[1]}`)) {
          console.log(`Found potential section match with key: ${key}`);
          const sectionText = extractSectionText(chapterData[key]);
          if (sectionText) {
            console.log(`Successfully extracted text from matched key, length: ${sectionText.length}`);
            return sectionText;
          }
        }
      }
    }
    
    // Approach 2: Direct section lookup in top level
    const fullSectionKey = `${chapter}ILCS${section}`;
    console.log(`Trying direct lookup with key: ${fullSectionKey}`);
    
    if (ilcsData[fullSectionKey]) {
      console.log(`Found section directly: ${fullSectionKey}`);
      const sectionText = extractSectionText(ilcsData[fullSectionKey]);
      if (sectionText) {
        console.log(`Successfully extracted text, length: ${sectionText.length}`);
        return sectionText;
      }
    }
    
    // Approach 3: Search through all top-level keys
    console.log('Searching through all top-level keys for matches...');
    for (const key in ilcsData) {
      if (key.includes(`${chapter}ILCS`) && key.includes(section)) {
        console.log(`Found potential match with top-level key: ${key}`);
        const data = ilcsData[key];
        
        // If it's a direct match
        const sectionText = extractSectionText(data);
        if (sectionText) {
          console.log(`Successfully extracted text from top-level key, length: ${sectionText.length}`);
          return sectionText;
        }
        
        // If it's an object, search within it
        if (typeof data === 'object' && data !== null) {
          for (const subKey in data) {
            if (subKey.includes(section)) {
              const subsectionText = extractSectionText(data[subKey]);
              if (subsectionText) {
                console.log(`Successfully extracted text from nested key ${key}->${subKey}, length: ${subsectionText.length}`);
                return subsectionText;
              }
            }
          }
        }
      }
    }
    
    console.log(`Section ${section} not found in ${fileName}`);
    console.log('Available sections/keys (first 20):', Object.keys(ilcsData).slice(0, 20));
    
    return null;
  } catch (error) {
    console.error(`Error processing ILCS data for ${chapter} ILCS ${section}:`, error);
    return null;
  }
}

export function generateTextDiff(originalText: string, proposedText: string): string {
  const originalLines = originalText.split('\n');
  const proposedLines = proposedText.split('\n');
  
  let diffHtml = '';
  let originalIndex = 0;
  let proposedIndex = 0;
  
  while (originalIndex < originalLines.length || proposedIndex < proposedLines.length) {
    const originalLine = originalLines[originalIndex] || '';
    const proposedLine = proposedLines[proposedIndex] || '';
    
    if (originalLine === proposedLine) {
      // Lines are the same
      diffHtml += `<div class="diff-unchanged">${escapeHtml(originalLine)}</div>`;
      originalIndex++;
      proposedIndex++;
    } else if (originalIndex >= originalLines.length) {
      // Addition
      diffHtml += `<div class="diff-addition" style="background-color: #d4edda; color: #155724;">${escapeHtml(proposedLine)}</div>`;
      proposedIndex++;
    } else if (proposedIndex >= proposedLines.length) {
      // Deletion
      diffHtml += `<div class="diff-deletion" style="background-color: #f8d7da; color: #721c24;">${escapeHtml(originalLine)}</div>`;
      originalIndex++;
    } else {
      // Modified line - show both
      diffHtml += `<div class="diff-deletion" style="background-color: #f8d7da; color: #721c24;">${escapeHtml(originalLine)}</div>`;
      diffHtml += `<div class="diff-addition" style="background-color: #d4edda; color: #155724;">${escapeHtml(proposedLine)}</div>`;
      originalIndex++;
      proposedIndex++;
    }
  }
  
  return diffHtml;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
