interface Props { url: string; width: number; height: number }

export default function ScreenshotPreview({ url, width, height }: Props) {
  return (
    <div className="ss-preview">
      <img src={url} alt="Cropped screenshot preview" draggable={false} />
      <span>{width} × {height}px</span>
    </div>
  );
}