
/**
 * Utility functions for text content processing
 */

// Function to clean up HTML content
export const cleanHtmlContent = (htmlContent: string) => {
  if (!htmlContent) return '';
  
  // If the content is a complete HTML document, return it as is
  if (htmlContent.includes('<!DOCTYPE') || 
      htmlContent.includes('<html>') ||
      htmlContent.includes('<body>')) {
    return htmlContent;
  }
  
  // Check for legislative document patterns (tables with legislative content)
  if (htmlContent.includes('<table') && (htmlContent.includes('<tr') || htmlContent.includes('SECTION'))) {
    try {
      // Extract meaningful content from the HTML
      const extractedText = extractMeaningfulContent(htmlContent);
      return `
        <div class="bill-text-content">
          ${extractedText}
        </div>
      `;
    } catch (e) {
      console.error("Error cleaning HTML content:", e);
    }
  }
  
  // Remove excess whitespace between tags for better display
  const cleanedContent = htmlContent
    .replace(/>\s+</g, '><')
    .trim();
  
  return `
    <div class="bill-text-content">
      ${cleanedContent}
    </div>
  `;
};

// Extract meaningful content from complex HTML
export const extractMeaningfulContent = (htmlContent: string) => {
  // First check if this is Illinois legislation which has a specific format
  if (htmlContent.includes('ilga.gov') || 
      htmlContent.includes('General Assembly') || 
      htmlContent.includes('Illinois Compiled Statutes')) {
    return extractIllinoisLegislation(htmlContent);
  }
  
  // This is a general extraction that tries to find text content
  // while removing most of the HTML structure
  
  // Check for specific bill headers and content
  const billNumberMatch = htmlContent.match(/HB\d+|SB\d+|HR\d+|SR\d+/);
  const billNumber = billNumberMatch ? billNumberMatch[0] : "";
  
  const synopsisMatch = htmlContent.match(/SYNOPSIS AS INTRODUCED:(.*?)(?:<\/td>|<\/code>|<\/p>)/is);
  const synopsis = synopsisMatch ? synopsisMatch[1].replace(/<\/?[^>]+(>|$)/g, "") : "";
  
  const actContentMatch = htmlContent.match(/AN ACT concerning(.*?)(?:<\/td>|<\/code>|<\/p>|\.)/is);
  const actContent = actContentMatch ? actContentMatch[1].replace(/<\/?[^>]+(>|$)/g, "") : "";
  
  // Extract any other text content that seems important
  const lines = htmlContent
    .replace(/<tr>|<\/tr>|<td[^>]*>|<\/td>|<table[^>]*>|<\/table>|<colgroup[^>]*>|<\/colgroup>/g, " ")
    .replace(/<code>|<\/code>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .split(/\.\s+/);
  
  const importantLines = lines
    .filter(line => line.trim().length > 20) // Only keep lines with substantial content
    .map(line => line.trim() + ".")
    .join("\n\n");
  
  // Formatted output
  return `
    ${billNumber ? `<h2 class="text-lg font-bold mb-4">${billNumber}</h2>` : ''}
    ${synopsis ? `<div class="mb-4"><h3 class="font-medium">SYNOPSIS</h3><p>${synopsis}</p></div>` : ''}
    ${actContent ? `<div class="mb-4"><h3 class="font-medium">ACT CONTENT</h3><p>${actContent}</p></div>` : ''}
    ${importantLines ? `<div class="mb-4"><h3 class="font-medium">BILL TEXT</h3><p>${importantLines}</p></div>` : ''}
  `;
};

// Extract Illinois legislation content
const extractIllinoisLegislation = (htmlContent: string) => {
  // Clean up the HTML and extract meaningful sections
  const cleanHtml = htmlContent
    .replace(/&nbsp;/g, ' ')
    .replace(/\r\n/g, '\n');
    
  // Extract bill number
  const billNumberMatch = cleanHtml.match(/([HS][BR]\d+)/i);
  const billNumber = billNumberMatch ? billNumberMatch[1] : '';
  
  // Extract sponsor
  const sponsorMatch = cleanHtml.match(/Filed with the Clerk by(.*?)(?:<\/|,|\.|$)/is);
  const sponsor = sponsorMatch ? sponsorMatch[1].trim() : '';
  
  // Format as clean HTML
  return `
    <div class="bill-legislation">
      ${billNumber ? `<h2>${billNumber}</h2>` : ''}
      ${sponsor ? `<p><strong>Filed by:</strong> ${sponsor}</p>` : ''}
      <div class="bill-content">
        ${cleanHtml}
      </div>
    </div>
  `;
};

// Convert Markdown syntax to HTML
export const convertMarkdownToHtml = (markdown: string): string => {
  if (!markdown) return "";
  
  // Handle headers (# Header, ## Header, ### Header)
  let html = markdown
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');
  
  // Handle bold (**text**)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Handle italic (*text*)
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // Handle lists
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>');
  
  // Handle paragraphs
  html = html.split('\n\n').map(para => {
    if (para.trim().startsWith('<h') || para.trim().startsWith('<li')) {
      return para;
    }
    return `<p class="mb-3">${para}</p>`;
  }).join('\n');
  
  // Wrap lists in <ul>
  html = html.replace(/(<li[^>]*>.*<\/li>\n)+/g, match => {
    return `<ul class="list-disc ml-6 mb-4">${match}</ul>`;
  });

  return html;
};

// Function to detect content type
export const detectContentType = (content: string): 'html' | 'markdown' | 'text' => {
  if (!content) return 'text';

  // Check if content is HTML
  if (content.includes('<table') || content.includes('<tr>') || content.includes('<td>') || 
      content.includes('<div') || content.includes('<p>')) {
    return 'html';
  }
  
  // Check if content is Markdown
  if (content.includes('# ') || content.includes('## ') || content.includes('- ') || 
     content.match(/\*\*.*\*\*/) || content.match(/\*.*\*/)) {
    return 'markdown';
  }
  
  return 'text';
};

// Get truncated display text
export const getDisplayText = (content: string, isHtml: boolean, showFullText: boolean): string => {
  if (!content) return "";
  
  if (showFullText || content.length <= 500) {
    return content;
  }
  
  if (isHtml) {
    // Basic HTML truncation - not perfect but provides a cutoff
    return content.substring(0, 500) + "... <p>[Content truncated]</p>";
  }
  
  return content.substring(0, 500) + "...";
};
