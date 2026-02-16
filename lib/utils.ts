/**
 * Strips <p> tags from inside <li> elements. TipTap/ProseMirror wraps list item
 * content in <p> tags by default, which can break list rendering on the frontend.
 * Use this when saving/displaying rich HTML from the editor.
 */
export function stripPFromListItems(html: string | null | undefined): string {
  if (!html) return "";
  let result = html;
  // Remove opening <p> inside <li> (with optional attributes)
  result = result.replace(/<li([^>]*)>\s*<p([^>]*)>/gi, "<li$1>");
  // Join multiple paragraphs in same li with <br>
  result = result.replace(/<\/p>\s*<p([^>]*)>/gi, "<br>");
  // Remove closing </p> before </li>
  result = result.replace(/<\/p>\s*<\/li>/gi, "</li>");
  return result;
}

/**
 * Strips HTML tags from a string and returns plain text (client-side)
 * @param html - HTML string to strip
 * @returns Plain text without HTML tags
 */
export function stripHtmlTags(html: string | null | undefined): string {
  if (!html) return "";
  
  // If we're in a browser environment, use DOM parsing
  if (typeof document !== "undefined") {
    try {
      const tmp = document.createElement("DIV");
      tmp.innerHTML = html;
      
      // Get text content and clean it up
      let text = tmp.textContent || tmp.innerText || "";
      
      // Decode HTML entities that might remain
      const textarea = document.createElement("textarea");
      textarea.innerHTML = text;
      text = textarea.value;
      
      // Remove extra whitespace and newlines, but preserve single spaces
      text = text.replace(/\s+/g, " ").trim();
      
      return text;
    } catch (e) {
      // Fallback to regex if DOM parsing fails
      return stripHtmlTagsServer(html);
    }
  }
  
  // Fallback to server-side method
  return stripHtmlTagsServer(html);
}

/**
 * Strips HTML tags from a string (server-side safe version)
 * Uses regex for environments without DOM access
 * @param html - HTML string to strip
 * @returns Plain text without HTML tags
 */
export function stripHtmlTagsServer(html: string | null | undefined): string {
  if (!html) return "";
  
  // Remove script and style tags completely (including their content)
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  
  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, "");
  
  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "...")
    .replace(/&copy;/g, "©")
    .replace(/&reg;/g, "®")
    .replace(/&trade;/g, "™");
  
  // Decode numeric HTML entities (&#123; format)
  text = text.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(parseInt(dec, 10));
  });
  
  // Decode hex HTML entities (&#x1F; format)
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  // Remove extra whitespace and newlines, but preserve single spaces
  text = text.replace(/\s+/g, " ").trim();
  
  return text;
}
