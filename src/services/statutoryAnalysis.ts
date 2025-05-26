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
  // Replace underlined text with [ADDITION] markers
  let text = htmlText.replace(/<u[^>]*>(.*?)<\/u>/gi, '[ADDITION]$1[/ADDITION]');
  
  // Replace strikethrough text with [DELETION] markers
  text = text.replace(/<s[^>]*>(.*?)<\/s>/gi, '[DELETION]$1[/DELETION]');
  text = text.replace(/<strike[^>]*>(.*?)<\/strike>/gi, '[DELETION]$1[/DELETION]');
  text = text.replace(/<del[^>]*>(.*?)<\/del>/gi, '[DELETION]$1[/DELETION]');
  
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
  
  const lines = cleanText.split('\n');
  
  let currentAmendment: Partial<StatutoryAmendment> | null = null;
  let amendmentCounter = 0;
  let isInAmendmentSection = false;
  
  console.log('Extracting amendments from', lines.length, 'lines of cleaned text');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    
    // Look for ILCS citations with various amendment patterns
    const ilcsMatch = line.match(/(\d+)\s+ILCS\s+(\d+[\/\-\d\.]*)/i);
    
    if (ilcsMatch && (lowerLine.includes('changing') || lowerLine.includes('amending') || lowerLine.includes('amended'))) {
      // Start a new amendment
      if (currentAmendment && currentAmendment.proposedText) {
        amendments.push(currentAmendment as StatutoryAmendment);
      }
      
      amendmentCounter++;
      const chapter = ilcsMatch[1];
      const section = ilcsMatch[2];
      
      currentAmendment = {
        id: `amendment-${amendmentCounter}`,
        citation: `${chapter} ILCS ${section}`,
        chapter,
        section,
        proposedText: ''
      };
      
      isInAmendmentSection = true;
      console.log('Found amendment:', currentAmendment.citation);
    } else if (currentAmendment && isInAmendmentSection) {
      // Check if we've reached the end of this amendment section
      if (line.trim() === '' && lines[i + 1] && lines[i + 1].match(/Section \d+/i)) {
        isInAmendmentSection = false;
      } else if (line.trim() !== '') {
        // Add to proposed text
        currentAmendment.proposedText += line + '\n';
      }
    }
  }
  
  // Add the last amendment if exists
  if (currentAmendment && currentAmendment.proposedText) {
    amendments.push(currentAmendment as StatutoryAmendment);
  }
  
  console.log('Extracted', amendments.length, 'amendments');
  amendments.forEach(a => console.log('Amendment:', a.citation, 'Text length:', a.proposedText.length));
  
  return amendments.map(amendment => ({
    ...amendment,
    proposedText: amendment.proposedText.trim()
  }));
}

/**
 * Fetches current statute text from ILCS storage bucket
 */
export async function fetchCurrentStatuteText(chapter: string, section: string): Promise<string | null> {
  try {
    console.log(`Fetching current statute text for ${chapter} ILCS ${section}`);
    
    // Try to download the JSON file for this chapter
    const { data, error } = await supabase.storage
      .from('ilcs')
      .download(`${chapter}ILCS.json`);
    
    if (error) {
      console.error(`Error fetching ILCS chapter ${chapter}:`, error);
      return null;
    }
    
    const text = await data.text();
    const ilcsData = JSON.parse(text);
    
    // Look for the specific section
    for (const key in ilcsData) {
      if (key.includes(section) || ilcsData[key][section]) {
        const sectionData = ilcsData[key][section];
        return sectionData?.text || sectionData || null;
      }
    }
    
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
