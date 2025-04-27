export function extractJsonFromMarkdown(text: string): string {
  // Remove all lines that start with backticks (```) for robust JSON extraction
  return text
    .split('\n')
    .filter(line => !line.trim().startsWith('```'))
    .join('\n')
    .trim();
} 