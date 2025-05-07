
/**
 * Utilities for formatting and enhancing bill text
 */

/**
 * Enhance Illinois bill text with better formatting
 */
export function enhanceIllinoisBillText(content: string): string {
  if (!content) return content;
  
  // For Illinois bills, they often come with minimal HTML
  if (content.includes('ilga.gov') || /illinois|general assembly/i.test(content)) {
    // If it's plain text without HTML structure, wrap it
    if (!content.includes('<html') && !content.includes('<body')) {
      return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      font-family: 'Noto Serif', Georgia, serif;
      line-height: 1.6;
      padding: 20px;
      max-width: 100%;
      overflow-x: auto;
    }
    h1, h2, h3 { color: #333; }
    h1 { font-size: 22px; }
    h2 { font-size: 18px; }
    pre { 
      white-space: pre-wrap;
      font-family: 'Courier New', monospace;
      background-color: #f5f5f5;
      padding: 10px;
      border-radius: 5px;
    }
    .bill-section {
      margin-bottom: 20px;
      padding-left: 20px;
      border-left: 2px solid #ddd;
    }
    .bill-header {
      font-weight: bold;
      margin-bottom: 10px;
    }
    .amendment { color: #c00; }
    .addition { color: #060; text-decoration: underline; }
    .deletion { color: #900; text-decoration: line-through; }
  </style>
</head>
<body>
  <div class="bill-content">
    ${formatIllinoisBillText(content)}
  </div>
</body>
</html>`;
    } else {
      // If it already has HTML structure, enhance the styling
      return enhanceExistingHtml(content);
    }
  }
  
  return content;
}

/**
 * Format Illinois bill text for better readability
 */
function formatIllinoisBillText(text: string): string {
  // Simple formatting for plain text bills
  const lines = text.split('\n');
  let formattedContent = '';
  let inSection = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.match(/^(Section|SECTION)\s+\d+/)) {
      // New section header
      if (inSection) {
        formattedContent += '</div>\n';
      }
      formattedContent += `<div class="bill-section">\n<h2>${trimmedLine}</h2>\n`;
      inSection = true;
    } else if (trimmedLine.match(/^[A-Z\s]{5,}$/)) {
      // All caps lines are likely headers
      formattedContent += `<h3>${trimmedLine}</h3>\n`;
    } else if (trimmedLine) {
      formattedContent += `<p>${trimmedLine}</p>\n`;
    } else {
      formattedContent += '<br/>\n';
    }
  }
  
  if (inSection) {
    formattedContent += '</div>\n';
  }
  
  return formattedContent;
}

/**
 * Enhance existing HTML with better styling
 */
function enhanceExistingHtml(html: string): string {
  // Add responsive styling to existing HTML
  const styleTag = `
<style>
  body, td, th { 
    font-family: 'Noto Serif', Georgia, serif;
    font-size: 14px;
    line-height: 1.6;
  }
  table { 
    border-collapse: collapse;
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    display: block;
    margin-bottom: 20px;
  }
  td, th {
    padding: 8px;
    vertical-align: top;
    border: 1px solid #ddd;
  }
  pre {
    white-space: pre-wrap;
    margin: 0;
  }
  s { color: #900; }
  u { color: #060; }
  center { font-weight: bold; }
  .amendment { color: #c00; }
  .bill-content {
    max-width: 100%;
    overflow-x: auto;
  }
  @media (max-width: 768px) {
    td, th { font-size: 12px; padding: 5px; }
  }
</style>`;
  
  // Insert our style tag
  if (html.includes('<head>')) {
    html = html.replace('<head>', `<head>${styleTag}`);
  } else if (html.includes('<html>')) {
    html = html.replace('<html>', `<html><head>${styleTag}</head>`);
  } else {
    html = `<!DOCTYPE html><html><head>${styleTag}</head><body><div class="bill-content">${html}</div></body></html>`;
  }
  
  return html;
}
