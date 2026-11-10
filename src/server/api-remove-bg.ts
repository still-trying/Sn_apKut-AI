import { createClient } from "@supabase/supabase-js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
};

function getAdminClient() {
  const supabaseUrl =
    process.env["SUPABASE_URL"] ||
    process.env["VITE_SUPABASE_URL"] ||
    "https://ugagaidwiadaluisxexo.supabase.co";

  const serviceRoleKey =
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
    process.env["VITE_SUPABASE_SERVICE_ROLE_KEY"] ||
    "";

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured on server.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function extractUrlFromResponse(data: unknown): string | null {
  if (typeof data === "string" && (data.startsWith("http://") || data.startsWith("https://"))) {
    return data.trim();
  }

  if (Array.isArray(data) && data.length > 0) {
    const first = data[0];
    if (typeof first === "string" && (first.startsWith("http://") || first.startsWith("https://"))) {
      return first.trim();
    }
    if (first && typeof first === "object") {
      const candidate = (first as Record<string, unknown>)["url"];
      if (typeof candidate === "string") return candidate.trim();
    }
  }

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (typeof obj["url"] === "string") return obj["url"].trim();

    const nestedData = obj["data"];
    if (nestedData && typeof nestedData === "object") {
      const nestedUrl = (nestedData as Record<string, unknown>)["url"];
      if (typeof nestedUrl === "string") return nestedUrl.trim();
    }

    const nestedResult = obj["result"];
    if (nestedResult && typeof nestedResult === "object") {
      const nestedUrl = (nestedResult as Record<string, unknown>)["url"];
      if (typeof nestedUrl === "string") return nestedUrl.trim();
    }
  }

  return null;
}

export async function handleRemoveBgApi(request: Request): Promise<Response> {
  // 1. CORS Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method Not Allowed. Send a POST request with your image binary or form data." }),
      { status: 405, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  try {
    // 2. Authentication & Authorization check
    const authHeader =
      request.headers.get("authorization") ||
      request.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized: Missing Authorization header.",
          help: "Include 'Authorization: Bearer <your_api_key>' in your request headers.",
        }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or empty Bearer token." }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const adminClient = getAdminClient();
    let profile: Record<string, unknown> | null = null;

    if (token.startsWith("sk_live_")) {
      // Authenticate via Developer Secret API Key
      const { data, error } = await adminClient
        .from("profiles")
        .select("*")
        .eq("api_key", token)
        .maybeSingle();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: Invalid secret API key." }),
          { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
      profile = data as Record<string, unknown>;
    } else {
      // Authenticate via Supabase User Session Token (for Web App frontend)
      const { data: authData, error: authError } = await adminClient.auth.getUser(token);
      if (authError || !authData?.user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: Session is invalid or expired." }),
          { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await adminClient
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: "User profile not found." }),
          { status: 404, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
      profile = data as Record<string, unknown>;
    }

    const userId = profile["id"] as string;
    const plan = (profile["plan"] as string) || "free";
    const isPro = plan === "pro";
    const creditsRemaining = typeof profile["credits_remaining"] === "number" ? profile["credits_remaining"] : 0;

    // 3. Quota & Credit Verification
    if (!isPro && creditsRemaining <= 0) {
      return new Response(
        JSON.stringify({
          error: "Payment Required: Credit balance exhausted (0 credits remaining).",
          help: "Upgrade to Pro for unlimited cutouts or purchase a 250 credits pack on your Sn_apKut AI dashboard.",
          plan,
          creditsRemaining: 0,
        }),
        { status: 402, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // 4. Extract Image Binary Payload
    const reqContentType = request.headers.get("content-type") || "";
    let imageBuffer: ArrayBuffer;
    let imageType = "image/png";
    let imageName = "cutout.png";

    if (reqContentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const fileEntry = formData.get("image") || formData.get("file") || formData.get("photo");
      if (!fileEntry || !(fileEntry instanceof Blob)) {
        return new Response(
          JSON.stringify({ error: "Bad Request: No image file provided in multipart form ('image' or 'file' field)." }),
          { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
      imageBuffer = await fileEntry.arrayBuffer();
      imageType = fileEntry.type || "image/png";
      if ("name" in fileEntry && typeof fileEntry.name === "string" && fileEntry.name) {
        imageName = fileEntry.name;
      }
    } else {
      imageBuffer = await request.arrayBuffer();
      if (reqContentType && reqContentType !== "application/octet-stream") {
        imageType = reqContentType.split(";")[0]?.trim() || "image/png";
      }
    }

    if (!imageBuffer || imageBuffer.byteLength === 0) {
      return new Response(
        JSON.stringify({ error: "Bad Request: Image payload is empty." }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    if (imageBuffer.byteLength > 15 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "Payload Too Large: Maximum allowed image size is 15 MB." }),
        { status: 413, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // 5. Forward to Upstream Background Removal Webhook / Model
    const upstreamUrl =
      process.env["BG_REMOVAL_WEBHOOK_URL"] ||
      process.env["VITE_BG_REMOVAL_WEBHOOK_URL"] ||
      "http://localhost:5678/webhook/remove bkgrnd";

    let upstreamRes: Response;
    try {
      upstreamRes = await fetch(encodeURI(upstreamUrl), {
        method: "POST",
        headers: {
          "Content-Type": imageType,
        },
        body: imageBuffer,
      });
    } catch (netErr) {
      console.error("Upstream connection error:", netErr);
      return new Response(
        JSON.stringify({
          error: "Background removal engine is currently unreachable.",
          details: `Could not connect to upstream ML webhook (${upstreamUrl}). If you are running locally, ensure your n8n / model is running. For cloud deployments, configure the BG_REMOVAL_WEBHOOK_URL environment variable.`,
        }),
        { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text().catch(() => "");
      return new Response(
        JSON.stringify({
          error: `Upstream processing failed with status ${upstreamRes.status}.`,
          upstreamMessage: errText,
        }),
        { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const responseText = await upstreamRes.text();
    let upstreamData: unknown;
    try {
      upstreamData = JSON.parse(responseText);
    } catch {
      upstreamData = responseText;
    }

    const extractedUrl = extractUrlFromResponse(upstreamData);
    if (!extractedUrl) {
      return new Response(
        JSON.stringify({
          error: "The background removal service did not return a valid result URL.",
          raw: responseText.slice(0, 500),
        }),
        { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // 6. Atomic Server-Side Credit Deduction & Quota Management
    let updatedCredits = isPro ? Infinity : Math.max(0, creditsRemaining - 1);
    const totalProcessed = (typeof profile["total_processed"] === "number" ? profile["total_processed"] : 0) + 1;
    const monthProcessed = (typeof profile["month_processed"] === "number" ? profile["month_processed"] : 0) + 1;

    if (!isPro) {
      await adminClient
        .from("profiles")
        .update({
          credits_remaining: updatedCredits,
          total_processed: totalProcessed,
          month_processed: monthProcessed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    } else {
      await adminClient
        .from("profiles")
        .update({
          total_processed: totalProcessed,
          month_processed: monthProcessed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    }

    // 7. Save Cutout to History in Supabase
    try {
      await adminClient.from("cutout_history").insert({
        user_id: userId,
        image_name: imageName,
        image_size: imageBuffer.byteLength,
        result_url: extractedUrl,
        raw_response: typeof upstreamData === "object" ? (upstreamData as Record<string, unknown>) : null,
      });
    } catch (saveErr) {
      console.warn("Could not save to cutout_history:", saveErr);
    }

    // 8. Return Success Response
    return new Response(
      JSON.stringify({
        success: true,
        url: extractedUrl,
        creditsRemaining: isPro ? "unlimited" : updatedCredits,
        plan,
        imageName,
      }),
      {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    console.error("handleRemoveBgApi exception:", err);
    return new Response(
      JSON.stringify({
        error: "Internal server error occurred while processing image.",
        details: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
}

