# Plan: Raycast Extension — Obsidian MD to Slack mrkdwn

## Context

Obsidian uses extended Markdown syntax that doesn't paste well into Slack. Slack uses its own "mrkdwn" format (not standard Markdown) with different conventions for bold, italic, links, etc. No existing Raycast extension handles Obsidian-specific syntax (wikilinks, highlights). We'll build a custom **no-view** Raycast command that reads clipboard, transforms Obsidian MD → Slack mrkdwn, and replaces clipboard content.

## Approach: Custom Raycast Extension (no-view command)

**Why not use the existing [Markdown Converter](https://www.raycast.com/ewilderj/markdown-converter)?**
It doesn't handle Obsidian-specific syntax (wikilinks `[[]]`, highlights `==text==`). Building custom gives us full control.

**Extension type:** `no-view` command — no UI needed, just clipboard transformation + HUD confirmation.

## Syntax Mapping Table

| Obsidian Markdown | Slack mrkdwn | Notes |
|---|---|---|
| `**bold**` | `*bold*` | Slack uses single asterisk for bold |
| `*italic*` or `_italic_` | `_italic_` | Underscore only in Slack |
| `~~strike~~` | `~strike~` | Single tilde in Slack |
| `# Heading` | `*Heading*` | Slack has no headings — bold the text |
| `## Heading` | `*Heading*` | Same treatment for all heading levels |
| `[text](url)` | `<url\|text>` | Slack link format uses angle brackets + pipe |
| `[[Page Name]]` | `Page Name` | Strip wikilink brackets, keep text |
| `[[Page\|Display]]` | `Display` | Use display text from aliased wikilinks |
| `==highlight==` | `*highlight*` | No highlight in Slack — bold as emphasis |
| `` `code` `` | `` `code` `` | Same syntax, no change needed |
| ```` ```lang ``` ```` | ```` ``` ``` ```` | Strip language identifier |
| `> blockquote` | `> blockquote` | Same syntax, no change needed |
| `- list item` | `- list item` | Same syntax (Slack doesn't render bullets but displays fine) |
| `1. item` | `1. item` | Same syntax |
| `![alt](url)` | `<url>` | Images become plain links |
| `---` (horizontal rule) | `———` | Em-dash line as visual separator |

## Project Structure

```
raycast-clip/
├── package.json              # Raycast extension manifest
├── tsconfig.json
├── src/
│   └── obsidian-to-slack.tsx  # Single no-view command
├── src/lib/
│   └── transform.ts          # Pure transformation logic (testable)
└── src/lib/
    └── transform.test.ts     # Unit tests for all mappings
```

## Implementation Steps

### 1. Scaffold Raycast extension
- `npm init` with Raycast extension structure
- `package.json` with Raycast manifest fields (`commands` array with `mode: "no-view"`)
- TypeScript config

### 2. Build transformation engine (`src/lib/transform.ts`)
- Pure function: `transformObsidianToSlack(input: string): string`
- Apply regex-based transformations in correct order (code blocks first to protect them, then inline transforms)
- **Order matters:** Extract code blocks → headings → bold → italic → strikethrough → links → wikilinks → highlights → images → horizontal rules

### 3. Build the command (`src/obsidian-to-slack.tsx`)
```typescript
import { Clipboard, showHUD } from "@raycast/api";
import { transformObsidianToSlack } from "./lib/transform";

export default async function Command() {
  const text = await Clipboard.readText();
  if (!text) {
    await showHUD("❌ Clipboard is empty");
    return;
  }
  const result = transformObsidianToSlack(text);
  await Clipboard.copy(result);
  await showHUD("✅ Converted to Slack format");
}
```

### 4. Write tests for all syntax mappings
- Test each mapping individually
- Test combined/nested syntax
- Test edge cases (empty input, code blocks containing markdown syntax, nested formatting)

### 5. Dev test in Raycast
- `npm install && npm run dev`
- Copy Obsidian text → trigger command → paste into Slack → verify formatting

## Verification

1. **Unit tests pass** for all 15 syntax mappings
2. **No-view command** triggers successfully in Raycast
3. **Clipboard workflow:** Copy Obsidian text → run command → clipboard contains Slack mrkdwn
4. **HUD feedback** shows success/error message
5. **Code blocks preserved** — markdown inside code blocks is NOT transformed
6. **Wikilinks** `[[Page]]` → `Page`, `[[Page|Text]]` → `Text`
7. **Highlights** `==text==` → `*text*`
8. **No Slack API tokens** required — pure text transformation

## Dependencies

- `@raycast/api` (Raycast SDK — provided by scaffold)
- No external Markdown parsing libraries needed — regex transformations are sufficient for this scope

## Key Sources

- [Raycast: Create Your First Extension](https://developers.raycast.com/basics/create-your-first-extension)
- [Raycast Clipboard API](https://developers.raycast.com/api-reference/clipboard)
- [Slack mrkdwn formatting reference](https://docs.slack.dev/messaging/formatting-message-text/)
- [Existing Markdown Converter extension](https://www.raycast.com/ewilderj/markdown-converter) (reference, not used)
