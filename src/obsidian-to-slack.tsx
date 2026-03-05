import { Clipboard, showHUD } from "@raycast/api";
import { transformObsidianToHtml, transformObsidianToSlack } from "./lib/transform";

export default async function Command() {
  const text = await Clipboard.readText();

  if (!text) {
    await showHUD("Clipboard is empty");
    return;
  }

  const html = transformObsidianToHtml(text);
  const plainText = transformObsidianToSlack(text);
  await Clipboard.copy({ html, text: plainText });
  await showHUD("Converted to Slack format (rich text)");
}
