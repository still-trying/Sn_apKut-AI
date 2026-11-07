import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Clock,
  Sparkles,
  FileImage,
} from "lucide-react";
import { CutoutHistoryItem } from "@/lib/history-storage";
import { toast } from "sonner";

interface HistoryGalleryProps {
  items: CutoutHistoryItem[];
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  onSelectForPreview?: (item: CutoutHistoryItem) => void;
  onGoToUpload?: () => void;
}

function formatBytes(bytes: number): string {
  if (!bytes || isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(timestamp: number): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryGallery({
  items,
  onDeleteItem,
  onClearAll,
  onSelectForPreview,
  onGoToUpload,
}: HistoryGalleryProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleCopyUrl = async (item: CutoutHistoryItem) => {
    try {
      await navigator.clipboard.writeText(item.resultUrl);
      setCopiedId(item.id);
      toast.success("Image URL copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy URL to clipboard.");
    }
  };

  const handleDownload = async (item: CutoutHistoryItem) => {
    setDownloadingId(item.id);
    try {
      const response = await fetch(item.resultUrl);
      if (!response.ok) throw new Error("Download request failed");
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      const baseName = item.name ? item.name.replace(/\.[^/.]+$/, "") : "cutout";
      link.download = `${baseName}-removed-bg.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      toast.success("Download started!");
    } catch {
      // Fallback: direct window download
      const link = document.createElement("a");
      link.href = item.resultUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.download = "removed-bg.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloadingId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center sm:p-12">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <Clock className="size-7" />
        </div>
        <h3 className="text-xl font-bold tracking-tight">No cutout history yet</h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Every image you process is automatically saved here in your local storage so you can easily access, view, and re-download your transparent cutouts anytime — even after closing or refreshing the browser.
        </p>
        {onGoToUpload && (
          <Button
            size="lg"
            onClick={onGoToUpload}
            className="bg-gradient-cta glow mt-6 border-0 font-semibold text-primary-foreground"
          >
            <Sparkles className="size-4" /> Remove a background now
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Gallery Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold">Processed Cutouts</h3>
          <Badge variant="secondary" className="px-2 py-0.5 text-xs font-semibold">
            {items.length} {items.length === 1 ? "image" : "images"}
          </Badge>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            · Stored locally in your browser
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (window.confirm("Are you sure you want to clear your cutout history?")) {
              onClearAll();
              toast.info("History cleared.");
            }
          }}
          className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" /> Clear history
        </Button>
      </div>

      {/* Grid of History Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const isCopied = copiedId === item.id;
          const isDownloading = downloadingId === item.id;

          return (
            <div
              key={item.id}
              className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg"
            >
              {/* Checkerboard Image Preview */}
              <div
                className="checkerboard relative flex h-52 w-full cursor-pointer items-center justify-center p-3"
                onClick={() => onSelectForPreview?.(item)}
                title="Click to view"
              >
                <img
                  src={item.resultUrl}
                  alt={item.name}
                  loading="lazy"
                  className="max-h-full max-w-full rounded object-contain transition-transform duration-200 group-hover:scale-105"
                />

                <div className="absolute top-2 right-2 rounded-md bg-background/80 px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm">
                  {formatDate(item.createdAt)}
                </div>
              </div>

              {/* Card Meta & Actions */}
              <div className="border-t border-border bg-muted/20 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground" title={item.name}>
                      {item.name || "Untitled cutout"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.size ? formatBytes(item.size) : "Transparent PNG"}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteItem(item.id)}
                    className="size-7 text-muted-foreground hover:text-destructive"
                    title="Remove from history"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-3 flex items-center gap-2 pt-2 border-t border-border/50">
                  <Button
                    size="sm"
                    className="h-8 flex-1 gap-1.5 text-xs font-semibold"
                    onClick={() => handleDownload(item)}
                    disabled={isDownloading}
                  >
                    <Download className="size-3.5" />
                    {isDownloading ? "Saving…" : "Download"}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => handleCopyUrl(item)}
                    title="Copy image URL"
                  >
                    {isCopied ? (
                      <Check className="size-3.5 text-green-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                    asChild
                  >
                    <a
                      href={item.resultUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open full size in new tab"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
