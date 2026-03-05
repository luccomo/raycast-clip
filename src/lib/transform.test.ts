import { describe, it, expect } from "vitest";
import { transformObsidianToSlack, transformObsidianToHtml } from "./transform";

describe("transformObsidianToSlack", () => {
  it("returns empty string for empty input", () => {
    expect(transformObsidianToSlack("")).toBe("");
  });

  it("returns undefined/null as-is", () => {
    expect(transformObsidianToSlack(undefined as unknown as string)).toBe(undefined);
  });

  // Headings
  it("converts h1 to bold", () => {
    expect(transformObsidianToSlack("# Hello")).toBe("*Hello*");
  });

  it("converts h2 to bold", () => {
    expect(transformObsidianToSlack("## Subheading")).toBe("*Subheading*");
  });

  it("converts h3 to bold", () => {
    expect(transformObsidianToSlack("### Deep heading")).toBe("*Deep heading*");
  });

  // Bold
  it("converts **bold** to *bold*", () => {
    expect(transformObsidianToSlack("**important**")).toBe("*important*");
  });

  // Italic (underscore form — works in both)
  it("preserves _italic_ as _italic_", () => {
    expect(transformObsidianToSlack("_emphasis_")).toBe("_emphasis_");
  });

  // Strikethrough
  it("converts ~~strike~~ to ~strike~", () => {
    expect(transformObsidianToSlack("~~deleted~~")).toBe("~deleted~");
  });

  // Links
  it("converts markdown links to Slack format", () => {
    expect(transformObsidianToSlack("[Click here](https://example.com)")).toBe(
      "<https://example.com|Click here>"
    );
  });

  // Wikilinks
  it("converts simple wikilinks to plain text", () => {
    expect(transformObsidianToSlack("See [[My Note]] for details")).toBe(
      "See My Note for details"
    );
  });

  it("converts aliased wikilinks to display text", () => {
    expect(transformObsidianToSlack("Check [[My Note|this note]]")).toBe(
      "Check this note"
    );
  });

  // Highlights
  it("converts ==highlight== to *bold*", () => {
    expect(transformObsidianToSlack("This is ==important== text")).toBe(
      "This is *important* text"
    );
  });

  // Images
  it("converts images to plain links", () => {
    expect(transformObsidianToSlack("![screenshot](https://img.com/pic.png)")).toBe(
      "<https://img.com/pic.png>"
    );
  });

  // Horizontal rules
  it("converts --- to em-dash line", () => {
    expect(transformObsidianToSlack("---")).toBe("———");
  });

  it("converts longer rules to em-dash line", () => {
    expect(transformObsidianToSlack("-----")).toBe("———");
  });

  // Code blocks — protection
  it("preserves content inside code blocks", () => {
    const input = "```js\nconst **x** = 1;\n```";
    const expected = "```\nconst **x** = 1;\n```";
    expect(transformObsidianToSlack(input)).toBe(expected);
  });

  it("strips language identifier from code blocks", () => {
    const input = "```python\nprint('hello')\n```";
    const expected = "```\nprint('hello')\n```";
    expect(transformObsidianToSlack(input)).toBe(expected);
  });

  // Inline code — protection
  it("preserves content inside inline code", () => {
    expect(transformObsidianToSlack("Use `**bold**` syntax")).toBe(
      "Use `**bold**` syntax"
    );
  });

  // Blockquotes (pass-through)
  it("preserves blockquotes", () => {
    expect(transformObsidianToSlack("> quoted text")).toBe("> quoted text");
  });

  // Lists (pass-through)
  it("preserves unordered lists", () => {
    expect(transformObsidianToSlack("- item one\n- item two")).toBe(
      "- item one\n- item two"
    );
  });

  it("preserves ordered lists", () => {
    expect(transformObsidianToSlack("1. first\n2. second")).toBe(
      "1. first\n2. second"
    );
  });

  // Combined transformations
  it("handles multiple transformations in one text", () => {
    const input = [
      "# Meeting Notes",
      "",
      "**Action items** from [[Weekly Standup|standup]]:",
      "",
      "- Fix the ==critical== bug",
      "- See [ticket](https://jira.com/123)",
      "",
      "---",
      "",
      "> Remember to update ~~old docs~~ first",
    ].join("\n");

    const expected = [
      "*Meeting Notes*",
      "",
      "*Action items* from standup:",
      "",
      "- Fix the *critical* bug",
      "- See <https://jira.com/123|ticket>",
      "",
      "———",
      "",
      "> Remember to update ~old docs~ first",
    ].join("\n");

    expect(transformObsidianToSlack(input)).toBe(expected);
  });

  // Italic with asterisks (the bold/italic ambiguity fix)
  it("converts *italic* to _italic_ in Slack", () => {
    expect(transformObsidianToSlack("This is *italic* text")).toBe(
      "This is _italic_ text"
    );
  });

  it("handles bold and italic together correctly", () => {
    expect(transformObsidianToSlack("**bold** and *italic*")).toBe(
      "*bold* and _italic_"
    );
  });

  // Callouts
  it("strips callout markers from blockquotes", () => {
    expect(transformObsidianToSlack("> [!warning] Be careful")).toBe(
      "> Be careful"
    );
  });

  // Embed wikilinks
  it("converts embed wikilinks to plain text", () => {
    expect(transformObsidianToSlack("See ![[My Document]] below")).toBe(
      "See My Document below"
    );
  });

  // Edge case: code block with markdown-like content
  it("does not transform markdown inside code blocks", () => {
    const input = [
      "Here is code:",
      "```",
      "# This is a comment",
      "**not bold**",
      "[[not a link]]",
      "```",
      "",
      "But **this** is bold",
    ].join("\n");

    const expected = [
      "Here is code:",
      "```",
      "# This is a comment",
      "**not bold**",
      "[[not a link]]",
      "```",
      "",
      "But *this* is bold",
    ].join("\n");

    expect(transformObsidianToSlack(input)).toBe(expected);
  });
});

describe("transformObsidianToHtml", () => {
  it("converts bold to b tags", () => {
    expect(transformObsidianToHtml("**bold**")).toBe("<b>bold</b>");
  });

  it("converts italic underscore to i tags", () => {
    expect(transformObsidianToHtml("_italic_")).toBe("<i>italic</i>");
  });

  it("converts strikethrough to s tags", () => {
    expect(transformObsidianToHtml("~~deleted~~")).toBe("<s>deleted</s>");
  });

  it("converts images to clickable URL links", () => {
    expect(transformObsidianToHtml("![alt](https://img.com/pic.png)")).toBe(
      '<a href="https://img.com/pic.png">https://img.com/pic.png</a>'
    );
  });

  it("converts links to a tags", () => {
    expect(transformObsidianToHtml("[click](https://example.com)")).toBe(
      '<a href="https://example.com">click</a>'
    );
  });

  it("strips callout markers in blockquotes", () => {
    const result = transformObsidianToHtml("> [!info] Some info");
    expect(result).toContain("<blockquote>");
    expect(result).not.toContain("[!info]");
  });

  it("converts embed wikilinks to plain text", () => {
    expect(transformObsidianToHtml("![[Embedded Note]]")).toBe("Embedded Note");
  });

  it("escapes HTML in body text", () => {
    expect(transformObsidianToHtml("a <script> tag")).toContain("&lt;script&gt;");
  });

  it("protects code block contents from transformation", () => {
    const result = transformObsidianToHtml("```js\n**not bold**\n```");
    expect(result).toContain("<pre><code>");
    expect(result).not.toContain("<b>");
  });
});
