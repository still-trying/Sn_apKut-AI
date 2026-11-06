import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, ImageIcon, Download, Sparkles, AlertCircle, ClipboardPaste, X, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const REMOVE_BACKGROUND_WEBHOOK = "http://localhost:5678/webhook/remove%20bkgrnd";

type State = "idle" | "ready" | "processing" | "done" | "error";

export function UploadZone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleFile = useCallback((file: File) => {
    setError(null);
    if (!ALLOWED.includes(file.type)) {
      setError("Unsupported format. Use JPG, PNG or WEBP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File is larger than 10 MB.");
      return;
    }
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    setSourceFile(file);
    setResultUrl(null);
    setState("ready");
  }, []);

  const removeBackground = async () => {
    if (!sourceFile || state === "processing") return;

    setError(null);
    setResultUrl(null);
    setState("processing");

    try {
      const body = new FormData();
      body.append("file", sourceFile, sourceFile.name);
      const response = await fetch(REMOVE_BACKGROUND_WEBHOOK, {
        method: "POST",
        body,
      });

      if (!response.ok) {
        throw new Error(`The processing service returned ${response.status}.`);
      }

      const data: unknown = await response.json();
      if (!data || typeof data !== "object" || !("url" in data) || typeof data.url !== "string") {
        throw new Error("The processing service did not return an image URL.");
      }

      const outputUrl = new URL(data.url);
      if (outputUrl.protocol !== "http:" && outputUrl.protocol !== "https:") {
        throw new Error("The processing service returned an unsupported image URL.");
      }
      if (outputUrl.protocol === "http:") outputUrl.protocol = "https:";

      setResultUrl(outputUrl.toString());
      setState("done");
    } catch (requestError) {
      setState("ready");
      setError(
        requestError instanceof Error
          ? `Background removal failed. ${requestError.message}`
          : "Background removal failed. Check that the local processing service is available.",
      );
    }
  };

  const downloadResult = async () => {
    if (!resultUrl) return;
    setDownloading(true);
    setError(null);
    try {
      const response = await fetch(resultUrl);
      if (!response.ok) throw new Error(`Download returned ${response.status}.`);
      const downloadUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "background-removed.png";
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } catch {
      setError("Could not download the result. Open the image and save it from your browser.");
    } finally {
      setDownloading(false);
    }
  };

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
        ALLOWED.includes(item.type),
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
    setSourceFile(null);
    setResultUrl(null);
    setError(null);
    setState("idle");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      {preview && sourceFile ? (
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
              {resultUrl ? (
                <img src={resultUrl} alt="Background removed" className="max-h-[32rem] max-w-full object-contain" />
              ) : (
                <div className="flex max-w-xs flex-col items-center gap-2 text-center">
                  {state === "processing" ? (
                    <LoaderCircle className="size-6 animate-spin text-primary" />
                  ) : (
                    <Sparkles className="size-6 text-primary" />
                  )}
                  <p className="font-medium">{state === "processing" ? "Removing background…" : "Your result will appear here"}</p>
                  <p className="text-sm text-muted-foreground">
                    {state === "processing" ? "Processing your image." : "Ready to remove the background."}
                  </p>
                </div>
              )}
            </div>
          </section>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 md:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              {state !== "done" && (
                <Button onClick={removeBackground} disabled={state === "processing"}>
                  {state === "processing" ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
                  {state === "processing" ? "Removing background…" : "Remove background"}
                </Button>
              )}
              {state === "done" && (
                <Button onClick={removeBackground} variant="secondary">
                  <Sparkles /> Remove again
                </Button>
              )}
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          </div>
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
            const file = Array.from(e.dataTransfer.files ?? []).find((candidate) => ALLOWED.includes(candidate.type));
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

      {state === "done" && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Background removed successfully.</p>
          <Button className="bg-gradient-cta glow border-0 font-semibold" onClick={downloadResult} disabled={downloading}>
            <Download /> {downloading ? "Preparing download…" : "Download PNG"}
          </Button>
        </div>
      )}
      {error && !sourceFile && (
        <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}