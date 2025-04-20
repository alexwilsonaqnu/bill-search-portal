
export const formatMessageContent = (content: string): string => {
  if (!content) return "";

  const hasBullets = content.includes("- ") || content.includes("* ");
  
  if (hasBullets) {
    const lines = content.split("\n");
    let inList = false;
    let formattedContent = "";
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
        if (!inList) {
          formattedContent += "<ul class='list-disc pl-5 my-2'>";
          inList = true;
        }
        formattedContent += `<li>${trimmedLine.substring(2)}</li>`;
      } else {
        if (inList) {
          formattedContent += "</ul>";
          inList = false;
        }
        if (trimmedLine) {
          formattedContent += `<p class='mb-2'>${trimmedLine}</p>`;
        } else {
          formattedContent += "<br />";
        }
      }
    });
    
    if (inList) {
      formattedContent += "</ul>";
    }
    
    return formattedContent;
  }
  
  return content.split("\n").map(line => 
    line.trim() ? `<p class='mb-2'>${line}</p>` : "<br />"
  ).join("");
};

