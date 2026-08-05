import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, ImageIcon, Download, Sparkles, AlertCircle } from "lucide-react";
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

  return (
    <div className="glass-card glow-soft mx-auto w-full max-w-2xl p-4 sm:p-6">
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
          "checkerboard relative flex min-h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors",
          dragging && "border-primary bg-primary/5",
        )}
      >
        {preview && state !== "error" ? (
          <img
            src={preview}
            alt="Selected upload preview"
            className={cn(
              "max-h-64 rounded-lg object-contain transition-all",
              state === "processing" && "opacity-60 blur-sm",
            )}
          />
        ) : (
          <>
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
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => inputRef.current?.click()}
            >
              <ImageIcon /> Browse files
            </Button>
          </>
        )}
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
