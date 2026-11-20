export async function copyPngToClipboard(blob: Blob): Promise<void> {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    throw new Error('Copying is not available on this page (it needs a secure https page). Use Download instead.');
  }
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}