import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, ImageIcon, Download, Sparkles, AlertCircle, ClipboardPaste, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

type State = "idle" | "processing" | "done" | "error";

export function UploadZone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    if (!ALLOWED.includes(file.type)) {
      setState("error");
      setError("Unsupported format. Use JPG, PNG or WEBP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setState("error");
      setError("File is larger than 10 MB.");
      return;
    }
    setPreview(URL.createObjectURL(file));
    setState("processing");
    setProgress(8);
    const timer = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          window.clearInterval(timer);
          setState("done");
          return 100;
        }
        return p + 12;
      });
    }, 220);
  }, []);

  const pasteFromClipboard = async () => {
    try {
      if (!navigator.clipboard?.read) {
        throw new Error("Clipboard image access is unavailable in this browser.");
      }
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((type) => ALLOWED.includes(type));
        if (!imageType) continue;
        const blob = await item.getType(imageType);
        const extension = imageType.split("/")[1] ?? "png";
        handleFile(new File([blob], `pasted-image.${extension}`, { type: imageType }));
        return;
      }
      setState("error");
      setError("No image found in your clipboard. Copy an image first, then try again.");
    } catch {
      setState("error");
      setError("Clipboard access was blocked. Use Ctrl+V or ⌘V to paste an image instead.");
    }
  };

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const image = Array.from(event.clipboardData?.items ?? []).find((item) =>
        item.type.startsWith("image/"),
      );
      const file = image?.getAsFile();
      if (file) {
        event.preventDefault();
        handleFile(file);
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleFile]);

  const clearPreview = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setProgress(0);
    setError(null);
    setState("idle");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      {preview && state !== "error" ? (
        <div className="grid overflow-hidden rounded-xl border border-border bg-card md:grid-cols-2">
          <section className="min-w-0 border-b border-border md:border-r md:border-b-0">
            <div className="flex h-12 items-center justify-between border-b border-border px-4">
              <span className="text-sm font-medium">Original</span>
              <Button variant="ghost" size="icon" aria-label="Remove image" onClick={clearPreview}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="checkerboard flex min-h-72 items-center justify-center p-5 sm:min-h-96">
              <img src={preview} alt="Original image" className="max-h-[32rem] max-w-full object-contain" />
            </div>
          </section>
          <section className="min-w-0">
            <div className="flex h-12 items-center justify-between border-b border-border px-4">
              <span className="text-sm font-medium">Result</span>
              <Button variant="ghost" size="sm" disabled>
                <Download /> Download
              </Button>
            </div>
            <div className="checkerboard flex min-h-72 items-center justify-center p-5 sm:min-h-96">
              <img
                src={preview}
                alt="Background removal preview"
                className={cn("max-h-[32rem] max-w-full object-contain", state === "processing" && "opacity-50 blur-sm")}
              />
            </div>
          </section>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          className={cn(
            "checkerboard relative flex min-h-72 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors",
            dragging && "border-primary bg-primary/5",
          )}
        >
          <div className="bg-gradient-cta glow flex size-12 items-center justify-center rounded-full">
            {state === "error" ? (
              <AlertCircle className="size-6 text-primary-foreground" />
            ) : (
              <Upload className="size-6 text-primary-foreground" />
            )}
          </div>
          <p className="mt-4 text-base font-semibold">Drop an image here</p>
          <p className="mt-1 text-sm text-muted-foreground">
            JPG, PNG or WEBP · up to 10 MB · max 5000×5000
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
              <ImageIcon /> Browse files
            </Button>
            <Button variant="outline" size="sm" onClick={pasteFromClipboard}>
              <ClipboardPaste /> Paste image
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">You can also paste an image with Ctrl+V or ⌘V</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label="Upload an image"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      )}

      {state === "processing" && (
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-primary" /> Cutting out the subject…
          </div>
          <Progress value={progress} />
        </div>
      )}

      {state === "error" && error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {state === "done" && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Preview ready — connect processing to export the transparent PNG.
          </p>
          <Button className="bg-gradient-cta glow border-0 font-semibold" disabled>
            <Download /> Download PNG
          </Button>
        </div>
      )}
    </div>
  );
}