# Obsidian to Slack

A [Raycast](https://raycast.com) extension that converts Obsidian-flavored Markdown in your clipboard to Slack-compatible formatting. Copies both **HTML** (for rich-text paste) and **mrkdwn** (plain-text fallback) to your clipboard.

## Why?

Obsidian and Slack use different markdown dialects. Copying from Obsidian and pasting into Slack produces broken formatting — `**bold**` shows as literal asterisks, `[[wikilinks]]` appear as raw brackets, and `==highlights==` mean nothing.

This extension fixes that with one hotkey: copy from Obsidian, trigger the command, paste into Slack with correct formatting.

## How It Works

1. Reads your clipboard contents (Obsidian Markdown)
2. Converts to **two formats simultaneously**:
   - **HTML clipboard** — Slack's rich text editor interprets this on paste, giving you real bold, italic, code, and links
   - **mrkdwn plain text** — fallback for apps that read the text clipboard
3. Replaces your clipboard with the converted content
4. Paste into Slack

## Conversion Table

| Obsidian | Slack (mrkdwn) | HTML Clipboard | Notes |
|----------|---------------|----------------|-------|
| `**bold**` | `*bold*` | `<b>bold</b>` | Slack uses single asterisks for bold |
| `*italic*` | `_italic_` | `<i>italic</i>` | Correctly disambiguated from bold |
| `_italic_` | `_italic_` | `<i>italic</i>` | Passes through unchanged |
| `~~strike~~` | `~strike~` | `<s>strike</s>` | Single tildes in Slack |
| `# Heading` | `*Heading*` | `<b>Heading</b>` | Slack has no headings — converted to bold |
| `[text](url)` | `<url\|text>` | `<a href="url">text</a>` | Different link syntax |
| `![alt](url)` | `<url>` | `<a href="url">url</a>` | Image URLs preserved for Slack unfurling |
| `[[Note]]` | `Note` | `Note` | Wikilinks become plain text |
| `[[Note\|alias]]` | `alias` | `alias` | Aliased wikilinks use display text |
| `![[Note]]` | `Note` | `Note` | Embed wikilinks become plain text |
| `==highlight==` | `*highlight*` | `<b>highlight</b>` | No highlight in Slack — becomes bold |
| `` `code` `` | `` `code` `` | `<code>code</code>` | Identical in mrkdwn |
| ` ```code``` ` | ` ```code``` ` | `<pre><code>code</code></pre>` | Language hints stripped |
| `> quote` | `> quote` | `<blockquote>quote</blockquote>` | Identical in mrkdwn |
| `> [!warning] text` | `> text` | `<blockquote>text</blockquote>` | Callout markers stripped |
| `---` | `———` | `<hr>` | Em-dash line substitute |

## What Doesn't Convert

Some Obsidian features have no Slack equivalent:

- **Tables** — Slack has no table support in messages
- **Task lists** (`- [ ]`) — No checkbox syntax in Slack
- **Footnotes** (`[^1]`) — Not supported
- **Math/LaTeX** (`$...$`) — Not supported
- **Tags** (`#tag`) — Conflicts with Slack's `#channel` syntax

## Installation

### From Source

```bash
git clone https://github.com/luccomo/raycast-clip.git
cd raycast-clip
npm install
npm run dev
```

This opens the extension in Raycast for development. You can assign a hotkey in Raycast preferences.

### Build

```bash
npm run build    # Build for production
npm run lint     # Run linter
npm test         # Run tests (36 tests)
```

## Project Structure

```
src/
  obsidian-to-slack.tsx    # Raycast command entry point
  lib/
    transform.ts           # Core transformation logic (mrkdwn + HTML)
    transform.test.ts      # Test suite (36 tests)
```

## Architecture

The transform module exports two functions:

- **`transformObsidianToSlack(input)`** — Returns Slack mrkdwn plain text
- **`transformObsidianToHtml(input)`** — Returns HTML for rich-text clipboard

Both functions use a **protect-transform-restore** pattern:

1. **Extract** code blocks and inline code into placeholders (protects from transformation)
2. **Transform** all formatting syntax in order (images before links, bold before italic, etc.)
3. **Restore** protected code blocks and inline code

The mrkdwn transform additionally extracts `*italic*` into placeholders before bold conversion to resolve the asterisk ambiguity (`*` = bold in Slack, italic in Obsidian).

## License

MIT
