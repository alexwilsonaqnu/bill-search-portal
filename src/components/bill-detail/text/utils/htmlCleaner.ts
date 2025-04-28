
// Utility functions for cleaning and processing HTML content
export const cleanHtmlContent = (htmlContent: string) => {
  // Process markdown-style formatting first
  let processedContent = htmlContent
    // Convert headers
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mb-2">$1</h3>')
    // Convert bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Convert italic text
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Convert bullet points
    .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
    .replace(/(?:\n\n|\r\n\r\n)(- .*(?:\n- .*)*)/g, '<ul class="list-disc mb-4">$1</ul>');

  // Remove excess whitespace between tags
  processedContent = processedContent
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ')
    .trim();

  return `
    <div class="bill-text-content">
      ${processedContent}
    </div>
  `;
};

export const extractMeaningfulContent = (htmlContent: string) => {
  const billNumberMatch = htmlContent.match(/HB\d+|SB\d+/);
  const billNumber = billNumberMatch ? billNumberMatch[0] : "";
  
  const synopsisMatch = htmlContent.match(/SYNOPSIS AS INTRODUCED:(.*?)(?:<\/td>|<\/code>)/is);
  const synopsis = synopsisMatch ? synopsisMatch[1].replace(/<\/?[^>]+(>|$)/g, "") : "";
  
  const actContentMatch = htmlContent.match(/AN ACT concerning(.*?)(?:<\/td>|<\/code>)/is);
  const actContent = actContentMatch ? actContentMatch[1].replace(/<\/?[^>]+(>|$)/g, "") : "";
  
  const lines = htmlContent
    .replace(/<tr>|<\/tr>|<td[^>]*>|<\/td>|<table[^>]*>|<\/table>|<colgroup[^>]*>|<\/colgroup>/g, " ")
    .replace(/<code>|<\/code>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .split(/\.\s+/);
  
  const importantLines = lines
    .filter(line => line.trim().length > 20)
    .map(line => line.trim() + ".")
    .join("\n\n");
  
  return `
    <h2 class="text-lg font-bold mb-4">${billNumber}</h2>
    ${synopsis ? `<div class="mb-4"><h3 class="font-medium">SYNOPSIS</h3><p>${synopsis}</p></div>` : ''}
    ${actContent ? `<div class="mb-4"><h3 class="font-medium">ACT CONTENT</h3><p>${actContent}</p></div>` : ''}
    ${importantLines ? `<div class="mb-4"><h3 class="font-medium">BILL TEXT</h3><p>${importantLines}</p></div>` : ''}
  `;
};
