import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  ImageIcon,
  Download,
  Sparkles,
  AlertCircle,
  ClipboardPaste,
  X,
  LoaderCircle,
  RotateCcw,
  CheckCircle2,
  Clock,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCutoutHistory } from "@/hooks/use-cutout-history";
import { HistoryGallery } from "@/components/site/HistoryGallery";
import { useUserCredits } from "@/hooks/use-user-credits";
import { canProcessImage, deductCreditOnSuccess } from "@/lib/credits-storage";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { useAuth } from "@/contexts/auth-context";
import { deductUserCredit, saveCutoutRecord, upgradeProfileToPro } from "@/lib/supabase";
import { toast } from "sonner";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const WEBHOOK_URL = "http://localhost:5678/webhook/remove bkgrnd";

type State = "idle" | "ready" | "processing" | "done";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function UploadZone() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"workspace" | "history">("workspace");
  const [dragging, setDragging] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const { history, addItem, removeItem, clear } = useCutoutHistory();
  const { plan: localPlan, creditsRemaining: localCredits, makePro } = useUserCredits();
  const { user, profile, refreshProfile } = useAuth();

  const effectivePlan = profile?.plan || localPlan;
  const effectiveCredits = profile?.credits_remaining ?? localCredits;

  // Listen for tab navigation events triggered from Header or other buttons
  useEffect(() => {
    const handleSwitchTab = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      if (customEvent.detail === "history" || customEvent.detail === "workspace") {
        setActiveTab(customEvent.detail as "workspace" | "history");
      }
    };
    window.addEventListener("snapkut_open_tab", handleSwitchTab);
    return () => window.removeEventListener("snapkut_open_tab", handleSwitchTab);
  }, []);

  const handleFile = useCallback((file: File) => {
    setError(null);
    if (!ALLOWED.includes(file.type)) {
      setError("Unsupported format. Please upload a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File is larger than 10 MB. Please choose a smaller image.");
      return;
    }

    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    setSourceFile(file);
    setResultUrl(null);
    setState("ready");
    setActiveTab("workspace");
  }, []);

  const removeBackground = async () => {
    if (!sourceFile || state === "processing") return;

    // Check Authentication: Strictly members only
    if (!user) {
      toast.info("Please sign in or create an account to remove backgrounds & claim 5 daily credits.", {
        action: {
          label: "Sign in",
          onClick: () => {
            navigate({ to: "/auth", search: { mode: "signin", redirect: "/#upload-zone" } });
          },
        },
      });
      navigate({ to: "/auth", search: { mode: "signup", redirect: "/#upload-zone" } });
      return;
    }

    // Check credits before processing
    if (effectivePlan !== "pro" && effectiveCredits <= 0) {
      setError(
        "You have used all your credits for today. Upgrade to Pro for unlimited background removals or buy credit packs.",
      );
      toast.error("Credit balance exhausted", {
        description: "You have 0 credits remaining today. Upgrade to Pro to continue.",
        action: {
          label: "Upgrade to Pro",
          onClick: () => {
            openRazorpayCheckout({
              planName: "Pro",
              amountInRupees: 799,
              description: "Unlimited high-resolution cutouts",
              onSuccess: async () => {
                if (user) {
                  await upgradeProfileToPro(user.id);
                  await refreshProfile();
                }
                makePro();
                toast.success("Account upgraded to Pro! Unlimited cutouts enabled.");
              },
            });
          },
        },
      });
      return;
    }

    setError(null);
    setResultUrl(null);
    setState("processing");

    try {
      // Send the image in binary format (ArrayBuffer) to the webhook
      const binaryData = await sourceFile.arrayBuffer();

      const response = await fetch(encodeURI(WEBHOOK_URL), {
        method: "POST",
        headers: {
          "Content-Type": sourceFile.type || "application/octet-stream",
        },
        body: binaryData,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(
          `Webhook returned status ${response.status}${errorText ? `: ${errorText}` : ""}`,
        );
      }

      const responseText = await response.text();
      let data: unknown;
      try {
        data = JSON.parse(responseText);
      } catch {
        if (responseText.startsWith("http://") || responseText.startsWith("https://")) {
          data = { url: responseText.trim() };
        } else {
          throw new Error("Invalid response from processing service. Expected JSON format.");
        }
      }

      // Extract the url property from the JSON response
      // e.g. { "url": "http://res.cloudinary.com/..." }
      let extractedUrl: string | null = null;

      if (Array.isArray(data) && data.length > 0) {
        const item: unknown = data[0];
        if (typeof item === "string" && (item.startsWith("http://") || item.startsWith("https://"))) {
          extractedUrl = item;
        } else if (item && typeof item === "object") {
          const itemObj = item as Record<string, unknown>;
          const candidate = itemObj["url"];
          if (typeof candidate === "string") {
            extractedUrl = candidate;
          }
        }
      } else if (data && typeof data === "object") {
        const obj = data as Record<string, unknown>;
        const directUrl = obj["url"];
        if (typeof directUrl === "string") {
          extractedUrl = directUrl;
        } else {
          const nestedData = obj["data"];
          if (nestedData && typeof nestedData === "object") {
            const nestedUrl = (nestedData as Record<string, unknown>)["url"];
            if (typeof nestedUrl === "string") {
              extractedUrl = nestedUrl;
            }
          } else {
            const nestedResult = obj["result"];
            if (nestedResult && typeof nestedResult === "object") {
              const nestedUrl = (nestedResult as Record<string, unknown>)["url"];
              if (typeof nestedUrl === "string") {
                extractedUrl = nestedUrl;
              }
            }
          }
        }
      }

      if (!extractedUrl) {
        throw new Error('The processing service returned JSON without a valid "url" field.');
      }

      const outputUrl = new URL(extractedUrl);
      if (outputUrl.protocol !== "http:" && outputUrl.protocol !== "https:") {
        throw new Error("The processing service returned an unsupported image URL scheme.");
      }

      // If page is on HTTPS and image is external HTTP (e.g. Cloudinary), upgrade to HTTPS to avoid mixed content
      if (
        typeof window !== "undefined" &&
        window.location.protocol === "https:" &&
        outputUrl.protocol === "http:" &&
        outputUrl.hostname !== "localhost" &&
        outputUrl.hostname !== "127.0.0.1"
      ) {
        outputUrl.protocol = "https:";
      }

      const finalUrl = outputUrl.toString();
      setResultUrl(finalUrl);
      setState("done");

      // Deduct credit in Supabase database & locally
      let currentRemaining = effectiveCredits - 1;
      let currentPlan = effectivePlan;

      if (user) {
        try {
          const creditRes = await deductUserCredit(user.id);
          currentRemaining = creditRes.remaining;
          currentPlan = creditRes.plan;

          // Save to Supabase cutout_history
          await saveCutoutRecord(user.id, {
            imageName: sourceFile.name || "image.png",
            imageSize: sourceFile.size,
            resultUrl: finalUrl,
            rawResponse:
              typeof data === "object" && data !== null
                ? (data as Record<string, unknown>)
                : undefined,
          });

          await refreshProfile();
        } catch (dbErr) {
          console.error("Database save error:", dbErr);
        }
      }

      // Also deduct locally for instant UI update
      deductCreditOnSuccess();

      // Save to Local Storage cache
      addItem({
        name: sourceFile.name || "image.png",
        size: sourceFile.size,
        resultUrl: finalUrl,
        rawResponse:
          typeof data === "object" && data !== null
            ? (data as Record<string, unknown>)
            : undefined,
      });

      if (currentPlan === "pro") {
        toast.success("Background removed! (Pro Unlimited)");
      } else {
        toast.success(`Background removed! 1 credit used (${currentRemaining} remaining today).`);
      }
    } catch (requestError) {
      setState("ready");
      if (requestError instanceof TypeError && requestError.message.toLowerCase().includes("fetch")) {
        setError(
          `Could not connect to webhook at ${WEBHOOK_URL}. Please ensure your n8n workflow is active, listening on port 5678, and permits requests.`,
        );
      } else {
        setError(
          requestError instanceof Error
            ? `Background removal failed: ${requestError.message}`
            : "Background removal failed. Check that the processing service is available.",
        );
      }
    }
  };

  const downloadResult = async () => {
    if (!resultUrl) return;
    setDownloading(true);
    setError(null);
    try {
      const response = await fetch(resultUrl);
      if (!response.ok) throw new Error(`Download request returned ${response.status}`);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      const baseName = sourceFile?.name ? sourceFile.name.replace(/\.[^/.]+$/, "") : "image";
      link.download = `${baseName}-removed-bg.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      toast.success("Download started!");
    } catch {
      // Fallback: direct download link if CORS prevents fetching the blob
      const link = document.createElement("a");
      link.href = resultUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.download = "removed-bg.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloading(false);
    }
  };

  const pasteFromClipboard = async () => {
    try {
      if (!navigator.clipboard?.read) {
        throw new Error("Clipboard image reading is not supported in this browser.");
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
      setError("No image found in your clipboard. Copy an image first, then click paste.");
    } catch {
      setError("Clipboard access was denied or unavailable. Use Ctrl+V or ⌘V to paste directly.");
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
      {/* Top Navigation Tabs: Remove Background Studio vs Cutout History */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "workspace" | "history")}
        >
          <TabsList className="bg-card/70 border border-border p-1 shadow-sm">
            <TabsTrigger value="workspace" className="gap-2 text-sm font-semibold">
              <Sparkles className="size-4 text-primary" />
              Remove Background
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 text-sm font-semibold">
              <Clock className="size-4 text-primary" />
              History
              {history.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 px-1.5 py-0 text-[11px] font-bold"
                >
                  {history.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs font-medium py-1 px-2.5 bg-card/60">
            {!user ? (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Sparkles className="size-3 text-primary" /> Sign in for 5 free credits
              </span>
            ) : effectivePlan === "pro" ? (
              <span className="text-primary font-semibold flex items-center gap-1">
                <Sparkles className="size-3" /> Pro Member (Unlimited)
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Sparkles className="size-3 text-primary" />
                <span className="font-semibold text-foreground">{effectiveCredits}</span> / 5 daily credits
              </span>
            )}
          </Badge>

          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Link
              to={user ? "/dashboard" : "/auth"}
              search={user ? {} : { redirect: "/dashboard" }}
            >
              Dashboard ➔
            </Link>
          </Button>
        </div>
      </div>

      {activeTab === "history" ? (
        /* History Gallery: Shows all saved background-removed images from Local Storage */
        <HistoryGallery
          items={history}
          onDeleteItem={removeItem}
          onClearAll={clear}
          onSelectForPreview={(item) => {
            setResultUrl(item.resultUrl);
            setPreview(item.resultUrl);
            setSourceFile(new File([], item.name, { type: "image/png" }));
            setState("done");
            setActiveTab("workspace");
            toast.info(`Opened "${item.name}" in preview.`);
          }}
          onGoToUpload={() => setActiveTab("workspace")}
        />
      ) : preview && sourceFile ? (
        /* Side-by-Side Comparison Grid */
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="grid md:grid-cols-2">
            {/* Left Column: Original Uploaded Image */}
            <section className="min-w-0 border-b border-border md:border-r md:border-b-0">
              <div className="flex h-12 items-center justify-between border-b border-border px-4 bg-muted/20">
                <div className="flex items-center gap-2 overflow-hidden text-left">
                  <span className="text-sm font-semibold">Original</span>
                  {sourceFile.size > 0 && (
                    <span className="truncate text-xs text-muted-foreground" title={sourceFile.name}>
                      ({formatBytes(sourceFile.size)})
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Remove and change image"
                  onClick={clearPreview}
                  className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" /> Change
                </Button>
              </div>
              <div className="checkerboard flex min-h-72 items-center justify-center p-5 sm:min-h-96">
                <img
                  src={preview}
                  alt={sourceFile.name || "Original uploaded preview"}
                  className="max-h-[30rem] max-w-full rounded object-contain transition-transform"
                />
              </div>
            </section>

            {/* Right Column: Result */}
            <section className="min-w-0">
              <div className="flex h-12 items-center justify-between border-b border-border px-4 bg-muted/20">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">Result</span>
                  {state === "done" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      <CheckCircle2 className="size-3" /> Ready
                    </span>
                  )}
                </div>
                {state === "done" && resultUrl ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 px-3 text-xs"
                    onClick={downloadResult}
                    disabled={downloading}
                  >
                    <Download className="size-3.5" />
                    {downloading ? "Downloading…" : "Download"}
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">Transparent PNG</span>
                )}
              </div>
              <div className="checkerboard relative flex min-h-72 items-center justify-center p-5 sm:min-h-96">
                {resultUrl ? (
                  <img
                    src={resultUrl}
                    alt="Background removed result"
                    className="max-h-[30rem] max-w-full rounded object-contain transition-all"
                  />
                ) : (
                  <div className="flex max-w-xs flex-col items-center gap-2 text-center">
                    {state === "processing" ? (
                      <>
                        <LoaderCircle className="size-8 animate-spin text-primary" />
                        <p className="font-semibold text-foreground">Removing background…</p>
                        <p className="text-xs text-muted-foreground">
                          Sending image to AI processing engine. This usually takes 2-5 seconds.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Sparkles className="size-6" />
                        </div>
                        <p className="font-semibold text-foreground">Ready to remove background</p>
                        <p className="text-xs text-muted-foreground">
                          Click the <span className="font-medium text-foreground">Remove background</span> button below to start processing.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Action Footer: Rendered ONLY AFTER image is loaded */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-card/60 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-3">
              {state !== "done" ? (
                <Button
                  size="lg"
                  onClick={removeBackground}
                  disabled={state === "processing"}
                  className="bg-gradient-cta glow border-0 font-semibold text-primary-foreground shadow-md transition-all hover:opacity-95"
                >
                  {state === "processing" ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Removing background…
                    </>
                  ) : !user ? (
                    <>
                      <Lock className="size-4" />
                      Sign in to remove background
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Remove background
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    onClick={downloadResult}
                    disabled={downloading}
                    className="bg-gradient-cta glow border-0 font-semibold text-primary-foreground shadow-md"
                  >
                    <Download className="size-4" />
                    {downloading ? "Preparing download…" : "Download PNG"}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={removeBackground}
                    className="gap-2"
                  >
                    <RotateCcw className="size-4" />
                    Process again
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={clearPreview}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Upload another image
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate max-w-[200px] sm:max-w-xs">{sourceFile.name}</span>
            </div>
          </div>

          {/* Error Message if any */}
          {error && (
            <div className="border-t border-destructive/20 bg-destructive/10 p-4 text-left">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div className="text-sm text-destructive">
                  <p className="font-semibold">Processing error</p>
                  <p className="mt-0.5 text-xs text-destructive/90">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Idle Dropzone: Shown before user performs upload, drag-and-drop, or copy-paste */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = Array.from(e.dataTransfer.files ?? []).find((candidate) =>
              ALLOWED.includes(candidate.type),
            );
            if (file) handleFile(file);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "checkerboard relative flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-8 text-center transition-all hover:border-primary/50 hover:bg-card/40",
            dragging && "border-primary bg-primary/10 shadow-[var(--glow-primary)]",
          )}
        >
          <div className="bg-gradient-cta glow flex size-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105">
            {state === "idle" ? (
              <Upload className="size-7 text-primary-foreground" />
            ) : (
              <AlertCircle className="size-7 text-primary-foreground" />
            )}
          </div>
          <p className="mt-4 text-lg font-bold">Drop your image here</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Supports JPG, PNG, or WEBP up to 10 MB
          </p>

          <div
            className="mt-5 flex flex-wrap justify-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="secondary"
              size="sm"
              className="font-medium shadow-sm hover:bg-secondary/80"
              onClick={() => inputRef.current?.click()}
            >
              <ImageIcon className="size-4" /> Browse files
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="font-medium"
              onClick={pasteFromClipboard}
            >
              <ClipboardPaste className="size-4" /> Paste image
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Or press <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-foreground">Ctrl+V</kbd> / <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-foreground">⌘V</kbd> anywhere to paste an image
          </p>

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

      {/* Standalone error when idle */}
      {error && !sourceFile && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
