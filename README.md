# ✂️ Sn_apKut AI

<div align="center">

![Sn_apKut AI Banner](public/snapkut-logo.png)

### **Next-Generation AI Background Removal Platform & Developer API**

[![Vite](https://img.shields.io/badge/Vite-8.3.6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TanStack Start](https://img.shields.io/badge/TanStack-Start-FF4154?style=for-the-badge&logo=react&logoColor=white)](https://tanstack.com/start)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payment%20Gateway-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF)](https://razorpay.com/)
[![Cloudflare / Nitro](https://img.shields.io/badge/Nitro-Cloudflare%20Edge-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://nitro.unjs.io/)

[Live Studio](https://sn_ap_kut_ai.vercel.app) • [Developer API Docs](#-developer-api-reference) • [Architecture](#-system-architecture) • [Database Schema](#-database-schema--rls) • [Quickstart](#-getting-started)

</div>

---

## 📌 Executive Summary

**Sn_apKut AI** is an enterprise-grade, commercial-ready Software-as-a-Service (SaaS) web studio and developer API engine for instant, high-precision AI background removal. Engineered with a full-stack modern architecture utilizing **TanStack Start**, **Vite 8 (Rolldown)**, **Supabase PostgreSQL & Auth**, and **Razorpay**, Sn_apKut AI bridges the gap between consumer photo workflows and automated enterprise image processing pipelines.

Whether used via the interactive browser studio with real-time before/after visualizers or integrated into third-party e-commerce workflows using secret API keys (`sk_live_...`), Sn_apKut delivers sub-second background extraction with atomic quota guarantees and cryptographic payment validation.

---

## 🌟 Key Highlights & Features

### 🎨 1. Studio-Grade Web Application
- **Interactive Drag & Drop Upload Zone**: Seamless drag-and-drop, native file browser, sample asset picker, and direct clipboard image paste (`Ctrl + V`).
- **Real-Time Comparison Slider**: Smooth, draggable interactive before-and-after split view allowing users to inspect fine edges, hair strands, and transparent cutouts.
- **Multi-Format High-Res Exports**: Export clean transparent images as PNG, WEBP, or crisp white-background JPGs.
- **Client-Side Validation & Security**: Pre-upload MIME type checking, size cap enforcement (up to 15 MB), and automated image caching.

### 🔑 2. Developer REST API (`/api/v1/remove-bg`)
- **Bearer Token Authentication**: Supports both **Developer Secret API Keys** (`sk_live_...`) for server-to-server pipelines and **User Session Tokens (JWT)** for client applications.
- **Dual Ingestion Formats**: Accepts raw image binary (`image/png`, `image/jpeg`, `image/webp`) or standard `multipart/form-data` uploads (`file`, `image`, or `photo` form fields).
- **Atomic Quota Enforcement**: Server-side pre-flight quota checks prevent race conditions and ensure non-Pro accounts are decremented precisely per successful cutout.
- **Sub-Second Upstream Routing**: High-throughput proxy layer connecting securely to upstream ML inference engines or containerized n8n webhooks.

### 💳 3. Monetization & Payment Infrastructure
- **Tiered Quota Architecture**:
  - **Free Tier**: 5 complimentary daily credits with automated rolling resets.
  - **Pro Tier**: Unlimited background removals with priority inference.
  - **Pay-As-You-Go Packs**: Instant 250 credit top-up packages.
- **Server-Side HMAC-SHA256 Verification**: Payments handled securely via Razorpay Orders API; payments are cryptographically verified before any credit or plan mutation occurs.
- **Invoices & Printable Receipts**: Complete transaction history with dynamic status badges, Razorpay payment reference IDs, and instant printable PDF invoice modals.

### 🛡️ 4. Security & Compliance
- **Strict Row Level Security (RLS)**: Public tables enforce user isolation policies (`auth.uid() = user_id`).
- **Protected Plan Modifications**: Client-side tampering of credits or plan tiers is blocked at the database level.
- **Cryptographic Account Termination**: IDOR-safe account deletion requiring authenticated JWT caller verification.
- **Rate-Limited Authentication**: Sliding-window rate limiting on registration endpoints to prevent bot flooding.
- **Regulatory Legal Suite**: Pre-configured, compliant Terms of Service, Privacy Policy, Refund Policy, and Shipping/Fulfillment Policy pages.

### 🩺 5. High-Frequency Observability (`/api/health`)
- Lightweight, zero-cold-start health endpoint designed for uptime services (**UptimeRobot**, **BetterStack**, **Pingdom**).
- Responds with `status`, `timestamp`, and `version` over `GET` and `HEAD` without querying backend databases or triggering SSR overhead.

---

## 🏗️ System Architecture

Sn_apKut AI utilizes a hybrid Edge SSR / Client-Side Architecture running on Nitro and Vite 8:

```mermaid
graph TD
    subgraph Clients["Clients & Consumers"]
        Browser["Modern Web Studio (React 19 / TanStack)"]
        ExternalAPI["Third-Party Apps & Scripts (cURL / Python)"]
        UptimeBot["Uptime Monitors (BetterStack / UptimeRobot)"]
    end

    subgraph EdgeLayer["Nitro Edge Server Engine"]
        ServerEntry["Server Handler (src/server.ts)"]
        HealthRoute["GET/HEAD /api/health"]
        ApiRemoveBg["POST /api/v1/remove-bg"]
        SSRHandler["TanStack Start SSR & RPC Router"]
    end

    subgraph SecurityAuth["Auth & Security Gate"]
        TokenParser["Bearer Token / API Key Parser"]
        RateLimiter["Sliding Window Rate Limiter"]
        HmacVerifier["HMAC-SHA256 Signature Validator"]
    end

    subgraph UpstreamServices["Backend & External Infrastructure"]
        SupabaseAuth["Supabase Auth (JWT & Identity)"]
        SupabaseDB[("Supabase PostgreSQL (RLS Protected)")]
        MLInference["Upstream ML Webhook / Inference (n8n / Container)"]
        RazorpayGateway["Razorpay API (Orders & Payments)"]
    end

    Browser -->|Interactive UI Requests| ServerEntry
    ExternalAPI -->|HTTP REST Requests| ServerEntry
    UptimeBot -->|Health Probes| HealthRoute

    ServerEntry -->|Path: /api/health| HealthRoute
    ServerEntry -->|Path: /api/v1/remove-bg| ApiRemoveBg
    ServerEntry -->|App & Server Functions| SSRHandler

    ApiRemoveBg --> TokenParser
    SSRHandler --> RateLimiter
    SSRHandler --> HmacVerifier

    TokenParser -->|Validate Session or sk_live_...| SupabaseDB
    ApiRemoveBg -->|Forward Image Payload| MLInference
    ApiRemoveBg -->|Atomic Credit Deduction & Cutout History| SupabaseDB
    HmacVerifier -->|Verify Payment Signatures| RazorpayGateway
    SSRHandler -->|Fetch Profile & Receipts| SupabaseDB
    SSRHandler -->|User Auth| SupabaseAuth
```

---

## 🔄 End-to-End Execution Flows

### 1. AI Background Removal Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor User as Client / External Dev
    participant Server as Nitro Server (/api/v1/remove-bg)
    participant DB as Supabase PostgreSQL
    participant AI as Upstream ML Engine (n8n / AI)

    User->>Server: POST /api/v1/remove-bg (Binary/Multipart + Bearer Token)
    Server->>Server: Validate MIME format & size (< 15 MB)
    
    alt Secret Key (sk_live_...)
        Server->>DB: Query profiles WHERE api_key = token
    else Session JWT
        Server->>DB: Verify JWT & fetch profile by user_id
    end

    DB-->>Server: Return user profile (plan, credits_remaining)

    alt Credits <= 0 AND Plan is Free
        Server-->>User: 402 Payment Required (Credit quota exhausted)
    else Sufficient Credits or Pro Plan
        Server->>AI: POST image binary with Content-Type
        AI-->>Server: Return transparent cutout result URL
        
        opt User is Free Plan
            Server->>DB: UPDATE profiles (credits_remaining - 1, total_processed + 1)
        end
        
        Server->>DB: INSERT into cutout_history (user_id, image_name, result_url)
        Server-->>User: 200 OK { success: true, url: "...", creditsRemaining: ... }
    end
```

### 2. Cryptographic Payment Verification Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer as User / Subscriber
    participant WebApp as Web Studio UI
    participant ServerFn as createRazorpayOrderServerFn
    participant RZP as Razorpay Gateway
    participant VerifyFn as verifyRazorpayPaymentServerFn
    participant DB as Supabase Profiles & Payments

    Customer->>WebApp: Select Plan (Pro @ ₹499 or 250 Credits @ ₹199)
    WebApp->>ServerFn: Invoke with Authenticated User Token
    ServerFn->>RZP: POST /v1/orders (amount, currency, receipt)
    RZP-->>ServerFn: Order Created { id: "order_xyz" }
    ServerFn-->>WebApp: Return { orderId, amount, keyId }

    WebApp->>Customer: Launch Razorpay Checkout Modal
    Customer->>RZP: Complete Payment (UPI / Card / NetBanking)
    RZP-->>WebApp: Return { razorpay_payment_id, razorpay_order_id, razorpay_signature }

    WebApp->>VerifyFn: POST verification payload
    Note over VerifyFn: Compute expected_sig = HMAC_SHA256(order_id + "|" + payment_id, SECRET)
    
    alt Signatures Match (crypto.timingSafeEqual)
        VerifyFn->>DB: UPDATE profiles SET plan = 'pro' (or add credits)
        VerifyFn->>DB: INSERT INTO payment_records (status: 'captured', ...)
        VerifyFn-->>WebApp: { success: true, plan: "pro" }
        WebApp-->>Customer: Display Success Toast & Instant Invoice
    else Signature Tampered
        VerifyFn-->>WebApp: 400 Bad Request { error: "Signature verification failed" }
        WebApp-->>Customer: Payment Verification Alert
    end
```

---

## 🗄️ Database Schema & RLS

The database is built on **PostgreSQL** inside **Supabase**. Row Level Security (RLS) is strictly enabled across all tables.

```mermaid
erDiagram
    PROFILES ||--o{ CUTOUT_HISTORY : owns
    PROFILES ||--o{ PAYMENT_RECORDS : generates
    
    PROFILES {
        uuid id PK "Matches auth.users.id"
        text email "User primary email"
        text full_name "Display name"
        text avatar_url "Profile avatar URL"
        text plan "'free' or 'pro'"
        integer credits_remaining "Remaining cutout quota"
        integer total_processed "Lifetime cutouts"
        integer month_processed "Cutouts processed this billing cycle"
        timestamp last_credit_reset_date "Daily reset tracking"
        text api_key "Secret developer token (sk_live_...)"
        timestamp created_at "Account creation timestamp"
        timestamp updated_at "Last profile update"
    }

    CUTOUT_HISTORY {
        uuid id PK "Unique cutout record ID"
        uuid user_id FK "References profiles.id"
        text image_name "Original uploaded file name"
        integer image_size "File size in bytes"
        text result_url "Secure transparent image URL"
        jsonb raw_response "Upstream engine metadata"
        timestamp created_at "Timestamp of generation"
    }

    PAYMENT_RECORDS {
        uuid id PK "Unique transaction identifier"
        uuid user_id FK "References profiles.id"
        text razorpay_payment_id "Razorpay transaction reference"
        text razorpay_order_id "Associated Razorpay order ID"
        text razorpay_signature "Cryptographic transaction signature"
        text plan_name "'Pro' or 'Credit packs'"
        numeric amount_in_rupees "Total transaction amount"
        text currency "Currency code (e.g. INR)"
        text status "Transaction state ('captured')"
        timestamp created_at "Payment capture timestamp"
    }

    CONTACT_INQUIRIES {
        uuid id PK "Unique inquiry ID"
        text ticket_id "Human-readable support ID (TKT-YYYYMMDD-XXXXX)"
        text name "Contact name"
        text email "Contact email"
        text phone "Optional phone number"
        text subject "Topic / Category"
        text message "Inquiry message content"
        text status "Status ('open', 'resolved')"
        timestamp created_at "Submission timestamp"
    }
```

### Complete Supabase SQL Setup

Execute the following script in the Supabase SQL Editor to provision the complete database schema, triggers, and Row Level Security policies:

```sql
-- 1. Create Profiles Table
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

-- 2. Create Cutout History Table
CREATE TABLE IF NOT EXISTS public.cutout_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_name TEXT NOT NULL,
    image_size INTEGER NOT NULL DEFAULT 0,
    result_url TEXT NOT NULL,
    raw_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Payment Records Table
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

-- 4. Create Contact Inquiries Table
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
-- Profiles: Users can read their own profile; updates to plan/credits are restricted to service role
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update personal details on own profile" ON public.profiles
    FOR UPDATE TO authenticated 
    USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);

-- Cutout History: Users can view and delete their own cutout records
CREATE POLICY "Users can read own cutouts" ON public.cutout_history
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cutouts" ON public.cutout_history
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Payment Records: Users can view their own transaction history
CREATE POLICY "Users can view own payments" ON public.payment_records
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Contact Inquiries: Anyone can insert inquiries; only service role can read
CREATE POLICY "Public insert inquiries" ON public.contact_inquiries
    FOR INSERT TO public WITH CHECK (true);

-- 7. Automated Daily Free Credit Reset RPC
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

### 1. Health Status Probe
Check system operational status and API version without authentication.

```http
GET /api/health
```

#### Response (`200 OK`)
```json
{
  "status": "ok",
  "timestamp": "2026-11-13T05:30:00.000Z",
  "version": "1.0.0"
}
```

---

### 2. Remove Image Background
Send an image payload and receive a transparent PNG result URL.

```http
POST /api/v1/remove-bg
```

#### Headers
| Header | Type | Description |
|---|---|---|
| `Authorization` | `string` | **Required**. `Bearer sk_live_...` (Developer Key) or Supabase JWT. |
| `Content-Type` | `string` | **Required**. `image/png`, `image/jpeg`, `image/webp`, or `multipart/form-data`. |

#### Response (`200 OK`)
```json
{
  "success": true,
  "url": "https://storage.provider.com/cutouts/transparent_output.png",
  "creditsRemaining": 4,
  "plan": "free",
  "imageName": "sample-portrait.png"
}
```

#### Status Codes
| Status | Code | Meaning |
|---|---|---|
| `200` | `OK` | Background removed successfully. Result URL included in payload. |
| `400` | `Bad Request` | Empty image buffer, invalid multipart form data, or unsupported format. |
| `401` | `Unauthorized` | Missing or invalid Bearer token / secret API key. |
| `402` | `Payment Required` | Quota exhausted (0 credits remaining). Requires upgrade or credit pack purchase. |
| `413` | `Payload Too Large` | Image file size exceeds the 15 MB limit. |
| `502` | `Bad Gateway` | Upstream AI inference engine unreachable or failed to process image. |

---

### 💻 Code Snippets

#### cURL (Binary Streaming)
```bash
curl -X POST "https://sn_ap_kut_ai.vercel.app/api/v1/remove-bg" \
  -H "Authorization: Bearer sk_live_your_secret_key_here" \
  -H "Content-Type: image/png" \
  --data-binary "@portrait.png"
```

#### cURL (Multipart Form Data)
```bash
curl -X POST "https://sn_ap_kut_ai.vercel.app/api/v1/remove-bg" \
  -H "Authorization: Bearer sk_live_your_secret_key_here" \
  -F "image=@portrait.jpg"
```

#### Python
```python
import requests

API_KEY = "sk_live_your_secret_key_here"
ENDPOINT = "https://sn_ap_kut_ai.vercel.app/api/v1/remove-bg"

with open("portrait.png", "rb") as image_file:
    response = requests.post(
        ENDPOINT,
        headers={"Authorization": f"Bearer {API_KEY}"},
        files={"image": image_file}
    )

data = response.json()
if response.status_code == 200:
    print(f"Cutout generated: {data['url']}")
    print(f"Credits Remaining: {data['creditsRemaining']}")
else:
    print(f"Error [{response.status_code}]: {data.get('error')}")
```

#### Node.js / TypeScript
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

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Background removal failed");
  }

  console.log("Cutout URL:", result.url);
  return result;
}
```

---

## 🛠️ Technology Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Core Framework** | [TanStack Start](https://tanstack.com/start) + [React 19](https://react.dev/) | Full-stack SSR, file-based routing, server functions (`createServerFn`) |
| **Bundler & Build Tool** | [Vite 8](https://vitejs.dev/) + [Rolldown](https://rolldown.rs/) | Sub-second HMR, optimized production code-splitting |
| **Styling & Components** | [Tailwind CSS 4](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) + [Lucide Icons](https://lucide.dev/) | Modern, accessible, dark/light responsive UI system |
| **Backend & Edge Runtime** | [Nitro](https://nitro.unjs.io/) (`cloudflare-module`) | High-concurrency edge computing & custom server route handlers |
| **Database & Identity** | [Supabase](https://supabase.com/) (PostgreSQL 15 + GoTrue Auth) | RLS policies, daily quota triggers, and user management |
| **Payment Gateway** | [Razorpay](https://razorpay.com/) (Orders API + Checkout JS) | Indian & International credit card, net banking, and UPI checkout |
| **Notifications & Toasts** | [Sonner](https://sonner.emilkowal.ski/) | Sleek, non-intrusive floating feedback toasts |

---

## ⚡ Production Bundle Optimization

Sn_apKut AI leverages Vite 8's native **Rolldown** code-splitting engine to partition bulky vendor dependencies into independent, cached chunks. This ensures initial page loads remain lightweight and eliminates all chunk size warnings:

| Chunk Name | Size | Gzip Size | Modules Included |
|---|---|---|---|
| `index-*.js` | **0.08 kB** | 0.09 kB | Thin application bootstrapper |
| `router-*.js` | **11.95 kB** | 4.38 kB | TanStack Router tree & route declarations |
| `auth-context-*.js` | **15.26 kB** | 4.57 kB | Session context & client auth hooks |
| `vendor-common-*.js` | **46.96 kB** | 15.80 kB | Shared third-party utilities |
| `vendor-radix-*.js` | **49.93 kB** | 16.10 kB | Radix UI primitives (dialogs, tabs, dropdowns) |
| `dashboard-*.js` | **67.53 kB** | 14.19 kB | User dashboard, gallery, and analytics views |
| `vendor-ui-*.js` | **78.81 kB** | 24.41 kB | Lucide icons, Sonner, Zod, and Tailwind merge |
| `vendor-tanstack-*.js` | **126.33 kB** | 42.57 kB | `@tanstack/react-router`, `@tanstack/react-query` |
| `vendor-supabase-*.js` | **213.09 kB** | 55.53 kB | `@supabase/supabase-js`, PostgREST client |
| `vendor-react-*.js` | **218.91 kB** | 68.33 kB | `react`, `react-dom`, `scheduler` |

---

## 📁 Repository Directory Structure

```text
Sn_apKut-AI/
├── public/                       # Static public assets, logos, and favicons
│   ├── favicon.png
│   ├── snapkut-logo.png
│   └── robots.txt
├── src/
│   ├── components/               # React UI components
│   │   ├── site/                 # Application feature components
│   │   │   ├── Header.tsx        # Top navigation & user session badge
│   │   │   ├── Footer.tsx        # Global footer with policies & branding
│   │   │   ├── UploadZone.tsx    # Drag-drop zone & before/after slider
│   │   │   └── HistoryGallery.tsx# Recent cutouts gallery modal
│   │   └── ui/                   # Reusable ShadCN / Radix UI atoms
│   ├── lib/                      # Core business logic & server functions
│   │   ├── supabase.ts           # Client-side Supabase client & DB queries
│   │   ├── server-auth.ts        # Server functions: register & delete account
│   │   ├── server-payment.ts     # Server functions: Razorpay orders & verification
│   │   ├── server-contact.ts     # Server functions: Contact ticket storage
│   │   ├── razorpay.ts           # Razorpay modal launcher & payment helpers
│   │   ├── credits-storage.ts    # Fallback storage for guest credits
│   │   └── history-storage.ts    # Local cache for recent cutouts
│   ├── routes/                   # TanStack Start file-based routes
│   │   ├── __root.tsx            # Global layout wrapper & navigation
│   │   ├── index.tsx             # Landing page & primary Web Studio
│   │   ├── auth.tsx              # Sign In, Sign Up, & Password Recovery
│   │   ├── dashboard.tsx         # User studio: credits, gallery, API keys, invoices
│   │   ├── contact.tsx           # Contact form & ticket submission
│   │   ├── terms.tsx             # Terms of Service
│   │   ├── privacy-policy.tsx    # Privacy Policy
│   │   ├── refund-policy.tsx     # Cancellation & Refund Policy
│   │   └── shipping-policy.tsx   # Shipping & Delivery Policy
│   ├── server/                   # Standalone server API route implementations
│   │   └── api-remove-bg.ts      # REST API route handler for /api/v1/remove-bg
│   ├── router.tsx                # TanStack Router configuration
│   └── server.ts                 # Nitro server entry: /api/health, /api/v1/remove-bg, SSR
├── .env.example                  # Environment configuration template
├── package.json                  # Dependencies & execution scripts
├── tsconfig.json                 # TypeScript compiler configuration
└── vite.config.ts                # Vite 8 + Rolldown configuration with code splitting
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
Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

Populate the required configuration keys:
```ini
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_jwt
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_secret

# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key

# Business Details (Required for Payment Compliance)
VITE_COMPANY_NAME="Sn_apKut AI"
VITE_SUPPORT_EMAIL="support@snapkut.ai"
VITE_SUPPORT_PHONE="+91 98765 43210"
VITE_BUSINESS_ADDRESS="Plot No. 42, Hitech City Main Road, Madhapur, Hyderabad, Telangana 500081, India"

# Optional: Upstream ML Webhook URL (Defaults to local inference)
BG_REMOVAL_WEBHOOK_URL=http://localhost:5678/webhook/remove%20bkgrnd
```

---

### Step 3: Run Database Migrations
Copy the SQL commands from the [Database Schema section](#complete-supabase-sql-setup) and execute them inside your Supabase project's **SQL Editor**.

---

### Step 4: Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port indicated in your console) in your browser.

---

### Step 5: Build for Production
To generate a production-ready build:
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
1. Link your GitHub repository in the Vercel dashboard.
2. Ensure the Framework Preset is set to **Other** (or TanStack Start).
3. Add all production environment variables from `.env` in the Vercel Project Settings.
4. Set Build Command to `npm run build` and Output Directory to `.output/public`.

---

## 🤝 Build with Lovable

This project was bootstrapped and styled with [Lovable](https://lovable.dev).

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f300f387-dc5e-4da7-bc22-c7fbcc43d988):
- **Ship faster**: Describe what you want to build and Lovable handles the code.
- **Stay in sync**: Every change made in Lovable is committed straight to this repository.
- **Full ownership**: The code is 100% yours. Push to `main` on GitHub and changes sync back seamlessly.

---

## 📄 License

This project is licensed under the **MIT License**. Feel free to use, modify, and distribute for commercial and private projects.

---

<div align="center">
Built with ❤️ by the <b>Sn_apKut AI Team</b>
</div>
