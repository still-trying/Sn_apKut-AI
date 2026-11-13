# ✂️ Sn_apKut AI

<div align="center">

![Sn_apKut AI Logo](public/snapkut-logo.png)

### **Production-Grade AI Background Removal Platform & Developer REST API**

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TanStack Start](https://img.shields.io/badge/TanStack_Start-1.168.60-FF4154?style=for-the-badge&logo=react&logoColor=white)](https://tanstack.com/start)
[![Vite](https://img.shields.io/badge/Vite-8.3.6_(Rolldown)-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2.1-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Orders_API_%26_Checkout-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF)](https://razorpay.com/)
[![Nitro](https://img.shields.io/badge/Nitro-Cloudflare_Module-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://nitro.unjs.io/)

[Live Application](https://sn_ap_kut_ai.vercel.app) • [System Architecture](#-system-architecture) • [Execution Flows](#-execution-flows) • [Database & Schema](#-database-schema--rls) • [Developer API Reference](#-developer-api-reference) • [Local Setup](#-getting-started)

</div>

---

## 📖 Overview

**Sn_apKut AI** is a full-stack, commercial-ready Software-as-a-Service (SaaS) application and developer API designed for instant, high-precision AI background removal. Built on **TanStack Start**, **React 19**, **Vite 8 (Rolldown engine)**, **Supabase PostgreSQL & Auth**, and **Razorpay Payments**, it offers:

1. **A Web Studio**: An interactive browser workspace featuring drag-and-drop uploads, clipboard image paste (`Ctrl+V`), real-time before/after comparison sliders, and one-click PNG downloads.
2. **A Developer REST API (`/api/v1/remove-bg`)**: A secure server endpoint accepting raw binary or multipart uploads, authenticated via Developer Secret Keys (`sk_live_...`) or Supabase session tokens, with atomic server-side quota deduction.
3. **Monetization & Billing**: A tiered credit and subscription engine powered by Razorpay with server-side HMAC-SHA256 signature verification, transaction history, and printable PDF invoices.
4. **Comprehensive Observability**: A lightweight health check endpoint (`/api/health`) for uptime monitoring (UptimeRobot, BetterStack, Pingdom).

---

## ⚡ Core Features & Capabilities

### 🎨 1. Interactive Web Studio
- **Flexible Image Ingestion**: Drag and drop images, browse locally, pick from sample portraits/products, or paste directly from the clipboard (`Ctrl+V`).
- **Interactive Before / After Split Slider**: Smooth, draggable comparison view to inspect fine edges, hair detail, and alpha transparency masks.
- **Client-Side Guardrails**: Enforces file format constraints (JPEG, PNG, WEBP) and maximum file size (10 MB in the web UI) before uploading.
- **Instant High-Quality PNG Export**: Downloads transparent cutouts directly to your device.

### 🔑 2. Developer REST API (`/api/v1/remove-bg`)
- **Dual Authentication Modes**:
  - **Developer Secret Key (`sk_live_...`)**: For automated backend scripts, bots, CLI tools, and e-commerce integrations.
  - **User Session Token (JWT)**: For authenticated web application calls.
- **Dual Ingestion Protocols**:
  - **Raw Binary Streaming**: Stream raw bytes with `Content-Type: image/png`, `image/jpeg`, or `image/webp`.
  - **Multipart Form-Data**: Upload standard form files using field names `image`, `file`, or `photo`.
- **Atomic Server-Side Credit Deduction**: Deducts 1 credit per successful cutout for Free users; Pro subscribers receive unlimited processing.
- **Upstream Forwarding**: Securely forwards image buffers to upstream ML inference workers or n8n webhooks (`BG_REMOVAL_WEBHOOK_URL`).

### 📊 3. User Dashboard
- **Overview Tab**: Real-time stats (Active Plan, Credits Remaining, Total Lifetime Processed, Monthly Processed) alongside a 7-day activity bar chart.
- **Upload Tab**: Embedded full-featured background removal workspace.
- **History Tab**: Gallery of previous cutouts with search, inline renaming, thumbnail previews, direct download, and cloud deletion synchronized with Supabase.
- **Billing Tab**: Current subscription state, instant upgrade to Pro (₹799/month), 250 credit packs (₹299), transaction table, and printable invoice receipts.
- **Developer API Tab**: Secret key viewer, one-click key rotation, endpoint documentation, and live cURL / Python code snippets with the user's active key.
- **Account Settings Tab**: Profile display name updates, password reset, and secure, session-verified account deletion.

### 💳 4. Razorpay Payments & Invoicing
- **Genuine Pricing Plans**:
  - **Free Tier**: **₹0** — 5 daily credits with rolling daily resets.
  - **Pro Tier**: **₹799 / month** — Unlimited cutouts, full resolution up to 5000×5000, priority queue.
  - **Credit Pack**: **₹299 / 250 credits** — Stackable, credits never expire, full API access.
- **Cryptographic Security**: Razorpay orders created on the server via Orders API in INR paise; webhook and client completion verified via server-side HMAC-SHA256 (`crypto.timingSafeEqual`).
- **Printable Invoices**: Every captured payment stores payment ID, order ID, amount, and timestamp for on-demand receipt rendering.

### 🛡️ 5. Security & Isolation
- **Row Level Security (RLS)**: PostgreSQL tables isolate user records (`auth.uid() = user_id`). Direct client updates to `plan` and `credits_remaining` are restricted.
- **IDOR-Safe Account Deletion**: `deleteAccountServerFn` verifies caller's JWT token server-side before removing profile, history, payments, and auth credentials.
- **Rate-Limited Registration**: Sliding-window rate limiter prevents brute-force account creation (max 5 attempts per 5 minutes per email).
- **Compliance Suite**: Dedicated routes for Terms of Service (`/terms`), Privacy Policy (`/privacy-policy`), Refund Policy (`/refund-policy`), and Shipping Policy (`/shipping-policy`).

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Clients["Clients & Applications"]
        Browser["React 19 Web Studio (Browser)"]
        DevClient["External Developer / Scripts (cURL, Python)"]
        Monitor["Uptime Monitors (BetterStack, UptimeRobot)"]
    end

    subgraph NitroEdge["Nitro Server Runtime (src/server.ts)"]
        ServerFetch["fetch() Dispatcher"]
        HealthHandler["GET/HEAD /api/health"]
        ApiHandler["POST /api/v1/remove-bg (api-remove-bg.ts)"]
        SSRHandler["TanStack Start SSR & Server Functions"]
    end

    subgraph ServerFunctions["Server Functions (createServerFn)"]
        AuthFn["server-auth.ts (Register, Delete Account, Delete Cutout)"]
        PaymentFn["server-payment.ts (Create Order, Verify HMAC, Get Invoices)"]
        ContactFn["server-contact.ts (Submit Inquiry)"]
    end

    subgraph ExternalBackends["External Services & Storage"]
        SupabaseAuth["Supabase GoTrue Auth"]
        SupabaseDB[("Supabase PostgreSQL (RLS Protected)")]
        MLWebhook["Upstream ML Inference / n8n Webhook"]
        RazorpayAPI["Razorpay Payments & Orders API"]
    end

    Browser -->|Studio UI & Sessions| ServerFetch
    DevClient -->|REST API Requests| ServerFetch
    Monitor -->|Health Checks| ServerFetch

    ServerFetch -->|Path: /api/health| HealthHandler
    ServerFetch -->|Path: /api/v1/remove-bg| ApiHandler
    ServerFetch -->|Pages & RPC Calls| SSRHandler

    SSRHandler --> AuthFn
    SSRHandler --> PaymentFn
    SSRHandler --> ContactFn

    ApiHandler -->|1. Validate sk_live_ or JWT| SupabaseDB
    ApiHandler -->|2. Forward Image Buffer| MLWebhook
    ApiHandler -->|3. Deduct Quota & Record History| SupabaseDB

    AuthFn -->|Admin Auth Operations| SupabaseAuth
    AuthFn -->|Delete Cascade| SupabaseDB
    PaymentFn -->|Create Orders & Fetch Details| RazorpayAPI
    PaymentFn -->|Update Plans & Log Invoices| SupabaseDB
    ContactFn -->|Insert Support Tickets| SupabaseDB
```

---

## 🔄 Execution Flows

### 1. Background Removal Flow (`/api/v1/remove-bg`)

```mermaid
sequenceDiagram
    autonumber
    actor Client as User / External API Client
    participant Server as Nitro Server (/api/v1/remove-bg)
    participant DB as Supabase PostgreSQL
    participant ML as Upstream Inference (n8n Webhook)

    Client->>Server: POST /api/v1/remove-bg (Binary or Multipart + Bearer Token)
    Server->>Server: Check Content-Type & Size (<= 15 MB)

    alt Token is Developer API Key (sk_live_...)
        Server->>DB: SELECT * FROM profiles WHERE api_key = token
    else User Session JWT
        Server->>DB: Validate token via auth.getUser and query profile
    end

    DB-->>Server: Return profile (plan, credits_remaining)

    alt Free Plan AND credits_remaining <= 0
        Server-->>Client: 402 Payment Required (Credits exhausted)
    else Pro Plan OR credits_remaining > 0
        Server->>ML: POST imageBuffer with original Content-Type
        ML-->>Server: Upstream Response (Transparent PNG URL)
        
        alt Free User
            Server->>DB: UPDATE profiles (credits_remaining - 1, total_processed + 1)
        else Pro User
            Server->>DB: UPDATE profiles (total_processed + 1)
        end
        
        Server->>DB: INSERT INTO cutout_history (user_id, image_name, result_url)
        Server-->>Client: 200 OK { success: true, url, creditsRemaining, plan }
    end
```

### 2. Payment Order & Cryptographic Verification Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User in Dashboard
    participant Client as React Dashboard
    participant ServerFn as createRazorpayOrderServerFn
    participant RZP as Razorpay API
    participant VerifyFn as verifyAndApplyPaymentServerFn
    participant DB as Supabase Profiles & Payments

    User->>Client: Click Upgrade to Pro (₹799) or Buy 250 Credits (₹299)
    Client->>ServerFn: Call with user access_token and planName
    ServerFn->>RZP: POST /v1/orders (amount: 79900 or 29900 paise, currency: INR)
    RZP-->>ServerFn: Order Created { id: "order_xyz", amount: 79900 }
    ServerFn-->>Client: Return { orderId, amount, keyId }

    Client->>User: Launch Razorpay Modal (UPI, Card, NetBanking)
    User->>RZP: Complete Payment
    RZP-->>Client: Return { razorpay_payment_id, razorpay_order_id, razorpay_signature }

    Client->>VerifyFn: Call with tokens and transaction details
    Note over VerifyFn: expected = HMAC_SHA256(order_id + "|" + payment_id, SECRET)
    
    alt Signatures Match (crypto.timingSafeEqual)
        alt Plan is Pro
            VerifyFn->>DB: UPDATE profiles SET plan = 'pro'
        else Plan is Credit packs
            VerifyFn->>DB: UPDATE profiles SET credits_remaining = credits_remaining + 250
        end
        VerifyFn->>DB: INSERT INTO payment_records (status: 'captured', ...)
        VerifyFn-->>Client: { success: true, plan, creditsRemaining }
        Client-->>User: Refresh Dashboard & Show Printable Receipt
    else Signature Verification Fails
        VerifyFn-->>Client: { success: false, error: "Payment verification failed" }
        Client-->>User: Show Payment Failure Alert
    end
```

### 3. User Registration Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Visitor on /auth
    participant Client as Auth Form
    participant ServerFn as registerUserServerFn
    participant Supabase as Supabase Admin Auth

    User->>Client: Submit Email & Password
    Client->>ServerFn: Call with { email, password, fullName }
    ServerFn->>ServerFn: Check Sliding-Window Rate Limit (Max 5/5min)

    alt Rate Limit Exceeded
        ServerFn-->>Client: 429 Too Many Attempts (retryAfter seconds)
    else Rate Limit OK
        ServerFn->>Supabase: admin.createUser({ email, password, email_confirm: true })
        Supabase-->>ServerFn: User Created (ID: uuid)
        ServerFn-->>Client: { success: true, userId }
        Client->>Client: Sign in immediately via supabase.auth.signInWithPassword
        Client-->>User: Redirect to /dashboard
    end
```

---

## 🗄️ Database Schema & RLS

All application data is hosted in **Supabase PostgreSQL (Mumbai `ap-south-1`)**.

```mermaid
erDiagram
    PROFILES ||--o{ CUTOUT_HISTORY : owns
    PROFILES ||--o{ PAYMENT_RECORDS : generates

    PROFILES {
        uuid id PK "Matches auth.users.id"
        text email "User email address"
        text full_name "Display name"
        text avatar_url "Avatar image URL"
        text plan "Plan tier: 'free' or 'pro'"
        integer credits_remaining "Cutouts remaining (default 5)"
        integer total_processed "Lifetime cutouts count"
        integer month_processed "Cutouts processed in current cycle"
        timestamp last_credit_reset_date "Date of last daily reset"
        text api_key "Developer key (sk_live_...)"
        timestamp created_at "Creation timestamp"
        timestamp updated_at "Update timestamp"
    }

    CUTOUT_HISTORY {
        uuid id PK "Unique cutout ID"
        uuid user_id FK "References profiles.id"
        text image_name "Original file name"
        integer image_size "Original file size in bytes"
        text result_url "Transparent PNG result URL"
        jsonb raw_response "Raw upstream metadata"
        timestamp created_at "Creation timestamp"
    }

    PAYMENT_RECORDS {
        uuid id PK "Unique payment record ID"
        uuid user_id FK "References profiles.id"
        text razorpay_payment_id "Razorpay Payment ID (pay_...)"
        text razorpay_order_id "Razorpay Order ID (order_...)"
        text razorpay_signature "Cryptographic signature"
        text plan_name "'Pro' or 'Credit packs'"
        numeric amount_in_rupees "799.00 or 299.00"
        text currency "Currency code ('INR')"
        text status "'captured'"
        timestamp created_at "Payment timestamp"
    }

    CONTACT_INQUIRIES {
        uuid id PK "Unique inquiry ID"
        text ticket_id "Ticket ID (TKT-YYMMDD-XXXXX)"
        text name "Sender full name"
        text email "Sender email"
        text phone "Sender phone (optional)"
        text subject "Topic category"
        text message "Inquiry message body"
        text status "'open' or 'resolved'"
        timestamp created_at "Submission timestamp"
    }
```

### Complete SQL Migration Script

Run this SQL in your Supabase SQL Editor to provision tables, triggers, and RLS policies:

```sql
-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
    credits_remaining INTEGER NOT NULL DEFAULT 5 CHECK (credits_remaining >= 0),
    total_processed INTEGER NOT NULL DEFAULT 0,
    month_processed INTEGER NOT NULL DEFAULT 0,
    last_credit_reset_date TIMESTAMPTZ DEFAULT NOW(),
    api_key TEXT UNIQUE NOT NULL DEFAULT ('sk_live_' || encode(gen_random_bytes(16), 'hex')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Cutout History Table
CREATE TABLE IF NOT EXISTS public.cutout_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_name TEXT NOT NULL,
    image_size INTEGER NOT NULL DEFAULT 0,
    result_url TEXT NOT NULL,
    raw_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Payment Records Table
CREATE TABLE IF NOT EXISTS public.payment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    razorpay_payment_id TEXT NOT NULL,
    razorpay_order_id TEXT,
    razorpay_signature TEXT,
    plan_name TEXT NOT NULL,
    amount_in_rupees NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'captured',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Contact Inquiries Table
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL DEFAULT 'general',
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cutout_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

-- 6. Row Level Security Policies
-- Profiles: authenticated users can read their own row
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT TO authenticated USING (auth.uid() = id);

-- Profiles: users can update safe personal fields (name, avatar); credits/plan are server-managed
CREATE POLICY "Users can update own details" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Cutouts: users read and delete their own records
CREATE POLICY "Users can read own cutouts" ON public.cutout_history
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cutouts" ON public.cutout_history
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Payments: users view their own transaction history
CREATE POLICY "Users can read own payments" ON public.payment_records
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Contact: public can insert inquiries
CREATE POLICY "Anyone can submit contact inquiry" ON public.contact_inquiries
    FOR INSERT TO public WITH CHECK (true);

-- 7. Daily Free Credit Reset RPC Function
CREATE OR REPLACE FUNCTION public.reset_daily_credits_if_needed(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET credits_remaining = 5,
        last_credit_reset_date = NOW(),
        updated_at = NOW()
    WHERE id = target_user_id
      AND plan = 'free'
      AND last_credit_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📡 Developer API Reference

### 1. Health Status (`GET /api/health` & `HEAD /api/health`)
A lightweight, zero-database health probe designed for uptime monitoring tools.

```http
GET /api/health
```

#### Response (`200 OK`)
```json
{
  "status": "ok",
  "timestamp": "2026-11-13T17:15:00.000Z",
  "version": "1.0.0"
}
```

---

### 2. Remove Background (`POST /api/v1/remove-bg`)
Removes the background from an image and returns a transparent PNG result URL.

```http
POST /api/v1/remove-bg
```

#### Headers
| Header | Type | Description |
|---|---|---|
| `Authorization` | `string` | **Required**. `Bearer sk_live_...` or Supabase Session JWT. |
| `Content-Type` | `string` | **Required**. `image/png`, `image/jpeg`, `image/webp`, or `multipart/form-data`. |

#### Response (`200 OK`)
```json
{
  "success": true,
  "url": "https://storage.provider.com/cutouts/transparent_output.png",
  "creditsRemaining": 4,
  "plan": "free",
  "imageName": "cutout.png"
}
```
*(For Pro subscribers, `"creditsRemaining"` returns `"unlimited"`).*

#### Status Codes
| Code | Reason | Cause |
|---|---|---|
| `200` | `OK` | Background removed successfully. |
| `400` | `Bad Request` | Empty image payload or missing file in multipart form data. |
| `401` | `Unauthorized` | Missing or invalid Bearer token / `sk_live_...` key. |
| `402` | `Payment Required` | Free credit balance exhausted (0 remaining). |
| `413` | `Payload Too Large` | Image payload exceeds the 15 MB server limit. |
| `502` | `Bad Gateway` | Upstream ML service unreachable or returned invalid data. |

---

### Code Examples

#### cURL (Binary Streaming)
```bash
curl -X POST "https://sn_ap_kut_ai.vercel.app/api/v1/remove-bg" \
  -H "Authorization: Bearer sk_live_your_api_key_here" \
  -H "Content-Type: image/png" \
  --data-binary "@portrait.png"
```

#### cURL (Multipart Form Upload)
```bash
curl -X POST "https://sn_ap_kut_ai.vercel.app/api/v1/remove-bg" \
  -H "Authorization: Bearer sk_live_your_api_key_here" \
  -F "image=@portrait.jpg"
```

#### Python (`requests`)
```python
import requests

API_KEY = "sk_live_your_api_key_here"
URL = "https://sn_ap_kut_ai.vercel.app/api/v1/remove-bg"

with open("photo.png", "rb") as f:
    response = requests.post(
        URL,
        headers={"Authorization": f"Bearer {API_KEY}"},
        files={"image": f}
    )

if response.status_code == 200:
    data = response.json()
    print("Transparent Cutout URL:", data["url"])
    print("Credits Remaining:", data["creditsRemaining"])
else:
    print(f"Error [{response.status_code}]:", response.json())
```

#### Node.js / TypeScript (`fetch`)
```typescript
import fs from "node:fs";

async function removeBackground(imagePath: string, apiKey: string) {
  const fileBuffer = fs.readFileSync(imagePath);

  const response = await fetch("https://sn_ap_kut_ai.vercel.app/api/v1/remove-bg", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "image/png",
    },
    body: fileBuffer,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Processing failed");
  }

  console.log("Cutout URL:", data.url);
  return data;
}
```

---

## 🛠️ Technology Stack

| Layer | Library / Service | Version | Description |
|---|---|---|---|
| **Frontend Framework** | [React](https://react.dev/) | `^19.2.0` | UI rendering & component architecture |
| **Full-Stack Router** | [TanStack Start](https://tanstack.com/start) | `1.168.60` | Full-stack SSR & Type-Safe Server Functions (`createServerFn`) |
| **Client Router** | [TanStack Router](https://tanstack.com/router) | `1.170.41` | Type-safe file-based client routing |
| **Client State / Cache** | [TanStack Query](https://tanstack.com/query) | `^5.101.1` | Async server state synchronization |
| **Bundler & Build Tool** | [Vite](https://vitejs.dev/) | `^8.1.5` / `8.3.6` | Next-generation bundler with Rolldown engine |
| **Server / Edge Engine** | [Nitro](https://nitro.unjs.io/) | `3.0.260603-beta` | Cloudflare Workers / Node.js preset server engine |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `^4.2.1` | Modern utility-first CSS |
| **UI Components** | [Radix UI](https://www.radix-ui.com/) | Latest | Accessible unstyled primitives (Dialog, Tabs, Slider, etc.) |
| **Icons** | [Lucide React](https://lucide.dev/) | `^0.575.0` | Crisp UI icon set |
| **Database & Auth** | [Supabase](https://supabase.com/) | `^2.119.0` | PostgreSQL 15, Row Level Security, GoTrue Auth |
| **Payments** | [Razorpay](https://razorpay.com/) | REST API + Checkout | Orders API, checkout modal, HMAC-SHA256 verification |
| **Toasts** | [Sonner](https://sonner.emilkowal.ski/) | `^2.0.7` | Toast notification manager |

---

## ⚡ Production Bundle & Code Splitting

Configured in [vite.config.ts](file:///c:/Users/DELL/OneDrive/Desktop/Sn_apKut-AI/vite.config.ts) using Rolldown code-splitting (`strictExecutionOrder: true`), producing **zero chunks over 500 kB**:

| Chunk Name | Size | Gzip Size | Modules Included |
|---|---|---|---|
| `index-*.js` | **0.08 kB** | 0.09 kB | Thin client bootstrapper |
| `rolldown-runtime-*.js` | **0.69 kB** | 0.41 kB | Rolldown module loader runtime |
| `router-*.js` | **11.95 kB** | 4.38 kB | Route declarations & tree |
| `auth-context-*.js` | **15.26 kB** | 4.57 kB | Supabase session state & auth hooks |
| `vendor-common-*.js` | **46.96 kB** | 15.80 kB | Shared third-party npm utilities |
| `vendor-radix-*.js` | **49.93 kB** | 16.10 kB | Radix UI primitives |
| `dashboard-*.js` | **67.53 kB** | 14.19 kB | User dashboard, tabs, and analytics |
| `vendor-ui-*.js` | **78.81 kB** | 24.41 kB | Lucide icons, Sonner, Zod, and Tailwind merge |
| `vendor-tanstack-*.js` | **126.33 kB** | 42.57 kB | `@tanstack/react-router`, `@tanstack/react-query` |
| `vendor-supabase-*.js` | **213.09 kB** | 55.53 kB | `@supabase/supabase-js`, PostgREST |
| `vendor-react-*.js` | **218.91 kB** | 68.33 kB | `react`, `react-dom`, `scheduler` |

---

## 📁 Repository Directory Structure

```text
Sn_apKut-AI/
├── public/                       # Static public assets (icons, logo, robots.txt)
│   ├── favicon.png
│   ├── snapkut-icon.png
│   ├── snapkut-logo.png
│   └── robots.txt
├── src/
│   ├── components/               # React UI components
│   │   ├── site/                 # Application feature components
│   │   │   ├── Header.tsx        # Top navigation & user session badge
│   │   │   ├── Footer.tsx        # Global footer with policies & branding
│   │   │   ├── UploadZone.tsx    # Drag-drop zone, before/after slider & download
│   │   │   └── HistoryGallery.tsx# Recent cutouts gallery modal
│   │   └── ui/                   # Reusable Radix UI / ShadCN atoms
│   ├── contexts/
│   │   └── auth-context.tsx      # AuthProvider: session management & OAuth
│   ├── hooks/
│   │   ├── use-cutout-history.ts # Hook for managing cutouts cache
│   │   ├── use-user-credits.ts   # Hook for reactive credit balance
│   │   └── use-mobile.tsx        # Viewport breakpoint detection hook
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client, queries & helper functions
│   │   ├── server-auth.ts        # Server functions: register & delete account
│   │   ├── server-payment.ts     # Server functions: Razorpay orders & verification
│   │   ├── server-contact.ts     # Server functions: Support ticket storage
│   │   ├── razorpay.ts           # Client-side Razorpay modal launcher
│   │   ├── credits-storage.ts    # Guest credits fallback storage
│   │   ├── history-storage.ts    # Local cutout history storage
│   │   └── utils.ts              # Tailwind class merge helper (cn)
│   ├── routes/                   # TanStack Start file-based route definitions
│   │   ├── __root.tsx            # Global layout wrapper
│   │   ├── index.tsx             # Landing page & primary Web Studio
│   │   ├── auth.tsx              # Sign In, Sign Up, OAuth & Password Recovery
│   │   ├── dashboard.tsx         # Dashboard: overview, upload, history, billing, API, settings
│   │   ├── contact.tsx           # Contact form & ticket submission
│   │   ├── terms.tsx             # Terms of Service
│   │   ├── privacy-policy.tsx    # Privacy Policy
│   │   ├── refund-policy.tsx     # Cancellation & Refund Policy
│   │   └── shipping-policy.tsx   # Shipping & Delivery Policy
│   ├── server/
│   │   └── api-remove-bg.ts      # REST API route handler for /api/v1/remove-bg
│   ├── router.tsx                # TanStack Router configuration
│   └── server.ts                 # Nitro server entry: /api/health, /api/v1/remove-bg, SSR
├── .env.example                  # Environment variable template
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript compiler configuration
└── vite.config.ts                # Vite 8 + Rolldown code-splitting configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20.x or higher
- **npm** or **bun**
- A **Supabase** project ([supabase.com](https://supabase.com))
- A **Razorpay** account ([dashboard.razorpay.com](https://dashboard.razorpay.com))
- An upstream background removal service or containerized **n8n** webhook

---

### Step 1: Clone & Install Dependencies
```bash
git clone https://github.com/still-trying/Sn_apKut-AI.git
cd Sn_apKut-AI
npm install
```

---

### Step 2: Configure Environment Variables
Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Populate the required configuration keys:
```ini
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_jwt_token
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_secret

# Supabase PostgreSQL Direct / Pooler Connections (Optional for migrations)
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xxx:password@aws-0-ap-south-1.pooler.supabase.com:5432/postgres

# Razorpay API Credentials
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key

# Business & Support Info (Used for customer receipts & compliance)
VITE_COMPANY_NAME="Sn_apKut AI"
VITE_SUPPORT_EMAIL="support@snapkut.ai"
VITE_SUPPORT_PHONE="+91 98765 43210"
VITE_BUSINESS_ADDRESS="Plot No. 42, Hitech City Main Road, Madhapur, Hyderabad, Telangana 500081, India"

# Upstream ML / Background Removal Webhook (Optional; defaults to local instance)
BG_REMOVAL_WEBHOOK_URL=http://localhost:5678/webhook/remove%20bkgrnd
```

---

### Step 3: Run Database Migrations
Copy the SQL commands from the [Database Schema section](#complete-sql-migration-script) and execute them in your Supabase project's **SQL Editor**.

---

### Step 4: Run Locally in Development Mode
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port displayed in your terminal) in your browser.

---

### Step 5: Build for Production
To build the application for production:
```bash
npm run build
```

To preview the built production bundle:
```bash
npm run preview
```

---

## 🚢 Deployment Guide

### Deploying to Cloudflare Pages / Workers
The project is pre-configured with Nitro's `cloudflare-module` preset.

1. Build the production output:
   ```bash
   npm run build
   ```
2. Deploy via Wrangler:
   ```bash
   npx wrangler deploy
   ```
3. Set your production environment variables in the Cloudflare Dashboard under **Workers & Pages > Settings > Variables**.

### Deploying to Vercel
1. Import your GitHub repository into the Vercel dashboard.
2. Select the **Other** framework preset (or TanStack Start).
3. Set Build Command to `npm run build` and Output Directory to `.output/public`.
4. Add all environment variables from `.env` in the Vercel Project Settings.

---

## 🤝 Build with Lovable

This project was bootstrapped and styled with [Lovable](https://lovable.dev).

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f300f387-dc5e-4da7-bc22-c7fbcc43d988):
- **Ship faster**: Describe what you want to build and Lovable handles the code.
- **Stay in sync**: Every change made in Lovable is committed straight to this repository.
- **Full ownership**: The code is 100% yours. Push to `main` on GitHub and changes sync back seamlessly.

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">
Built with ❤️ by the <b>Sn_apKut AI Team</b>
</div>
