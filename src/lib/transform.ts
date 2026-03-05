/**
 * Transforms Obsidian-flavored Markdown into Slack mrkdwn format.
 *
 * Transformation order matters — code blocks are extracted first to protect
 * their contents from being transformed, then restored at the end.
 */

const CODE_BLOCK_PLACEHOLDER = "%%CODEBLOCK_";

/**
 * Escapes HTML special characters.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Transforms Obsidian-flavored Markdown into HTML suitable for
 * rich-text clipboard pasting into Slack, Teams, Notion, etc.
 */
export function transformObsidianToHtml(input: string): string {
  if (!input) return input;

  // 1. Extract code blocks
  const codeBlocks: string[] = [];
  let text = input.replace(/```([\w]*)\n([\s\S]*?)```/g, (_match, _lang: string, code: string) => {
    const index = codeBlocks.length;
    codeBlocks.push(escapeHtml(code.replace(/\n$/, "")));
    return `${CODE_BLOCK_PLACEHOLDER}${index}%%`;
  });

  // 2. Extract inline code
  const inlineCode: string[] = [];
  text = text.replace(/`([^`]+)`/g, (_match, code: string) => {
    const index = inlineCode.length;
    inlineCode.push(escapeHtml(code));
    return `%%INLINECODE_${index}%%`;
  });

  // 3. Escape remaining HTML in body text
  text = escapeHtml(text);

  // 4. Headings → bold (Slack has no headings)
  text = text.replace(/^#{1,6}\s+(.+)$/gm, "<b>$1</b>");

  // 5. Images → clickable URL links (Slack strips <img> tags on paste,
  //    but preserves <a> links which it then unfurls after sending)
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<a href="$2">$2</a>');

  // 6. Markdown links → HTML links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // 7. Embed wikilinks: ![[Note]] → just the name (can't embed in Slack)
  text = text.replace(/!\[\[([^\]]+)\]\]/g, "$1");

  // 8. Wikilinks with alias → display text
  text = text.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2");

  // 9. Wikilinks without alias → page name
  text = text.replace(/\[\[([^\]]+)\]\]/g, "$1");

  // 10. Highlights → bold (Slack has no highlight)
  text = text.replace(/==([^=]+)==/g, "<b>$1</b>");

  // 10. Bold: **text** → <b>text</b>
  text = text.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");

  // 11. Italic: _text_ or *text* → <i>text</i>
  text = text.replace(/(?<!\w)_([^_]+)_(?!\w)/g, "<i>$1</i>");
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<i>$1</i>");

  // 12. Strikethrough: ~~text~~ → <s>text</s>
  text = text.replace(/~~([^~]+)~~/g, "<s>$1</s>");

  // 13. Horizontal rules
  text = text.replace(/^---+$/gm, "<hr>");

  // 14. Blockquotes: > text → blockquote (strip callout markers like [!info])
  text = text.replace(/^&gt;\s*\[!(\w+)\]\s*/gm, "&gt; ");
  text = text.replace(/^&gt;\s?(.+)$/gm, "<blockquote>$1</blockquote>");

  // 15. Restore inline code
  text = text.replace(/%%INLINECODE_(\d+)%%/g, (_match, index: string) => {
    return `<code>${inlineCode[parseInt(index)]}</code>`;
  });

  // 16. Restore code blocks
  text = text.replace(new RegExp(`${CODE_BLOCK_PLACEHOLDER}(\\d+)%%`, "g"), (_match, index: string) => {
    return `<pre><code>${codeBlocks[parseInt(index)]}</code></pre>`;
  });

  // 17. Convert newlines to <br> for rich text
  text = text.replace(/\n/g, "<br>");

  return text;
}

export function transformObsidianToSlack(input: string): string {
  if (!input) return input;

  // 1. Extract code blocks to protect their contents
  const codeBlocks: string[] = [];
  let text = input.replace(/```[\w]*\n([\s\S]*?)```/g, (_match, code: string) => {
    const index = codeBlocks.length;
    codeBlocks.push(code);
    return `${CODE_BLOCK_PLACEHOLDER}${index}%%`;
  });

  // 2. Extract inline code to protect it
  const inlineCode: string[] = [];
  text = text.replace(/`([^`]+)`/g, (_match, code: string) => {
    const index = inlineCode.length;
    inlineCode.push(code);
    return `%%INLINECODE_${index}%%`;
  });

  // 3. Extract *italic* (single asterisks) BEFORE bold conversion
  //    This solves the ambiguity: *italic* vs **bold** both use asterisks
  //    but map to different Slack syntax (_italic_ vs *bold*)
  const italics: string[] = [];
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, (_match, content: string) => {
    const index = italics.length;
    italics.push(content);
    return `%%ITALIC_${index}%%`;
  });

  // 4. Headings → bold text (all levels)
  text = text.replace(/^#{1,6}\s+(.+)$/gm, "*$1*");

  // 5. Images → plain links
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "<$2>");

  // 6. Markdown links → Slack links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<$2|$1>");

  // 7. Embed wikilinks: ![[Note]] → just the name
  text = text.replace(/!\[\[([^\]]+)\]\]/g, "$1");

  // 8. Wikilinks with alias → display text
  text = text.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2");

  // 9. Wikilinks without alias → page name
  text = text.replace(/\[\[([^\]]+)\]\]/g, "$1");

  // 9. Highlights → bold (Slack has no highlight)
  text = text.replace(/==([^=]+)==/g, "*$1*");

  // 10. Bold: **text** → *text* (Slack bold is single asterisk)
  text = text.replace(/\*\*([^*]+)\*\*/g, "*$1*");

  // 11. Restore italic placeholders as Slack italic (_text_)
  text = text.replace(/%%ITALIC_(\d+)%%/g, (_match, index: string) => {
    return `_${italics[parseInt(index)]}_`;
  });

  // 12. Strikethrough: ~~text~~ → ~text~
  text = text.replace(/~~([^~]+)~~/g, "~$1~");

  // 13. Callouts: strip [!type] markers from blockquotes
  text = text.replace(/^>\s*\[!(\w+)\]\s*/gm, "> ");

  // 14. Horizontal rules → em-dash line
  text = text.replace(/^---+$/gm, "———");

  // 15. Escape & in body text (Slack mrkdwn requirement)
  //     Skip already-converted Slack links which contain & in URLs
  text = text.replace(/&(?!amp;|lt;|gt;)/g, "&amp;");

  // 13. Restore inline code
  text = text.replace(/%%INLINECODE_(\d+)%%/g, (_match, index: string) => {
    return "`" + inlineCode[parseInt(index)] + "`";
  });

  // 14. Restore code blocks (without language identifier)
  text = text.replace(new RegExp(`${CODE_BLOCK_PLACEHOLDER}(\\d+)%%`, "g"), (_match, index: string) => {
    return "```\n" + codeBlocks[parseInt(index)] + "```";
  });

  return text;
}
