// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-User-JWT, X-Auth-Mode",
};

const LOG_FULL_TOKENS = Deno.env.get("LOG_FULL_TOKENS") === "true";

interface ValidationRequest {
  platform: "android" | "ios";
  purchaseToken: string;
  productId: string;
  userId?: string;
  sessionJwt?: string;
}

interface ValidationResponse {
  is_premium: boolean;
  expiry_date?: string;
  platform: string;
  product_id?: string;
  error?: string;
}

interface GooglePlaySubscription {
  kind?: string;
  startTimeMillis?: string;
  expiryTimeMillis?: string;
  autoRenewing?: boolean;
  paymentState?: number;
  cancelReason?: number;
  cancelSurveyResult?: unknown;
  userCancellationTimeMillis?: string;
}

interface GooglePlaySubscriptionV2LineItem {
  productId?: string;
  expiryTime?: string;
}

interface GooglePlaySubscriptionV2 {
  kind?: string;
  subscriptionState?: string;
  lineItems?: GooglePlaySubscriptionV2LineItem[];
}

interface AppleReceiptInfo {
  expires_date_ms: string;
  product_id: string;
  cancellation_date_ms?: string;
}

interface AppleValidationResponse {
  status: number;
  latest_receipt_info?: AppleReceiptInfo[];
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function summarizeTokenForLog(token?: string | null): string {
  if (!token) return "<empty>";
  if (LOG_FULL_TOKENS) return token;
  if (token.length <= 16) return `${token} (len=${token.length})`;
  return `${token.slice(0, 10)}...${token.slice(-6)} (len=${token.length})`;
}

async function tokenFingerprint(token?: string | null): Promise<string> {
  if (!token) return "na";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  const bytes = Array.from(new Uint8Array(digest)).slice(0, 6);
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function base64UrlEncode(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function getGoogleAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/androidpublisher",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );

  const signingInput = `${header}.${payload}`;
  const pem: string = sa.private_key;
  const pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const signatureB64 = base64UrlEncode(new Uint8Array(signatureBuffer));
  const signedJwt = `${signingInput}.${signatureB64}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signedJwt,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`Google OAuth2 token exchange failed: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token as string;
}

function isGoogleV2StateActive(subscriptionState?: string): boolean | undefined {
  const state = (subscriptionState || "").toUpperCase();
  if (!state) return undefined;
  if (state === "SUBSCRIPTION_STATE_ACTIVE" || state === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD") return true;
  if (
    state === "SUBSCRIPTION_STATE_EXPIRED" ||
    state === "SUBSCRIPTION_STATE_CANCELED" ||
    state === "SUBSCRIPTION_STATE_ON_HOLD" ||
    state === "SUBSCRIPTION_STATE_PAUSED" ||
    state === "SUBSCRIPTION_STATE_PENDING"
  ) return false;
  return undefined;
}

async function validateGooglePlaySubscriptionV2(
  packageName: string,
  productId: string,
  purchaseToken: string,
  accessToken: string
): Promise<{ isPremium: boolean; expiryDate?: string; resolvedProductId?: string }> {
  const v2Url =
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications` +
    `/${packageName}/purchases/subscriptionsv2/tokens/${purchaseToken}`;

  const v2Res = await fetch(v2Url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!v2Res.ok) {
    const body = await v2Res.text();
    throw new Error(`Google Play API v2 ${v2Res.status}: ${body}`);
  }

  const subV2: GooglePlaySubscriptionV2 = await v2Res.json();
  const lineItems = subV2.lineItems ?? [];
  const lineItem = lineItems.find((it) => it.productId === productId) ?? lineItems[0];
  const resolvedProductId = lineItem?.productId || productId;
  const expiryMs = lineItem?.expiryTime ? Date.parse(lineItem.expiryTime) : 0;
  const expiryDate = expiryMs ? new Date(expiryMs).toISOString() : undefined;
  const stateActive = isGoogleV2StateActive(subV2.subscriptionState);
  const notExpired = expiryMs > Date.now();
  const isPremium = stateActive !== undefined ? stateActive && notExpired : notExpired;

  console.log(
    `[Google Play v2] productId=${resolvedProductId} state=${subV2.subscriptionState}` +
    ` expiryMs=${expiryMs} isPremium=${isPremium}`
  );

  return { isPremium, expiryDate, resolvedProductId };
}

async function validateGooglePlaySubscriptionV1(
  packageName: string,
  productId: string,
  purchaseToken: string,
  accessToken: string
): Promise<{ isPremium: boolean; expiryDate?: string; resolvedProductId?: string }> {
  const v1Url =
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications` +
    `/${packageName}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`;

  const v1Res = await fetch(v1Url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!v1Res.ok) {
    const body = await v1Res.text();
    throw new Error(`Google Play API v1 ${v1Res.status}: ${body}`);
  }

  const sub: GooglePlaySubscription = await v1Res.json();
  const expiryMs = sub.expiryTimeMillis ? parseInt(sub.expiryTimeMillis, 10) : 0;
  const expiryDate = expiryMs ? new Date(expiryMs).toISOString() : undefined;
  const paymentOk = sub.paymentState === 1 || sub.paymentState === 2;
  const notExpired = expiryMs > Date.now();
  const isPremium = paymentOk && notExpired;

  console.log(
    `[Google Play v1] productId=${productId} paymentState=${sub.paymentState}` +
    ` expiryMs=${expiryMs} isPremium=${isPremium}`
  );

  return { isPremium, expiryDate, resolvedProductId: productId };
}

async function validateGooglePlaySubscription(
  packageName: string,
  productId: string,
  purchaseToken: string,
  serviceAccountJson: string
): Promise<{ isPremium: boolean; expiryDate?: string; resolvedProductId?: string; error?: string }> {
  const accessToken = await getGoogleAccessToken(serviceAccountJson);

  let v2Error = "";
  try {
    return await validateGooglePlaySubscriptionV2(packageName, productId, purchaseToken, accessToken);
  } catch (error) {
    v2Error = toErrorMessage(error);
    console.warn("[Google Play] Falha no endpoint subscriptionsv2, tentando fallback v1...", v2Error);
  }

  try {
    return await validateGooglePlaySubscriptionV1(packageName, productId, purchaseToken, accessToken);
  } catch (error) {
    const v1Error = toErrorMessage(error);
    throw new Error(`Falha na validacao Google Play. v2=${v2Error}; v1=${v1Error}`);
  }
}

async function persistIapStatus(
  supabase: any,
  row: {
    user_id: string;
    platform: "android" | "ios";
    product_id: string;
    purchase_token: string;
    expiry_date: string | null;
    is_premium: boolean;
    updated_at: string;
  }
): Promise<{ error: any }> {
  const { data: updatedRows, error: updateError } = await supabase
    .from("iap_status")
    .update(row)
    .eq("user_id", row.user_id)
    .eq("platform", row.platform)
    .select("id");

  if (updateError) return { error: updateError };
  if (Array.isArray(updatedRows) && updatedRows.length > 0) return { error: null };

  const { error: insertError } = await supabase.from("iap_status").insert(row);
  return { error: insertError };
}

async function validateAppleReceipt(
  receiptData: string,
  sharedSecret: string,
  verifyUrl: string
): Promise<{ isPremium: boolean; expiryDate?: string; error?: string }> {
  const body = {
    "receipt-data": receiptData,
    password: sharedSecret,
    "exclude-old-transactions": true,
  };

  const appleRes = await fetch(verifyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const appleData: AppleValidationResponse = await appleRes.json();

  if (appleData.status === 21007) {
    const sandboxRes = await fetch("https://sandbox.itunes.apple.com/verifyReceipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const sandboxData: AppleValidationResponse = await sandboxRes.json();
    return parseAppleResponse(sandboxData);
  }

  return parseAppleResponse(appleData);
}

function parseAppleResponse(
  data: AppleValidationResponse
): { isPremium: boolean; expiryDate?: string; error?: string } {
  if (data.status !== 0 || !data.latest_receipt_info?.length) {
    return { isPremium: false, error: `Apple validation status ${data.status}` };
  }

  const latest = data.latest_receipt_info[0];
  const expiryMs = parseInt(latest.expires_date_ms, 10);
  const expiryDate = new Date(expiryMs).toISOString();
  const isPremium = expiryMs > Date.now() && !latest.cancellation_date_ms;

  return { isPremium, expiryDate };
}

// ---------------------------------------------------------------------------
// Edge Function entry point
// ---------------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body: ValidationRequest = await req.json();
    const { platform, purchaseToken, productId, userId: userIdFromBody, sessionJwt } = body;

    const authHeader = req.headers.get("Authorization") || "";
    const authHeaderToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    const userJwtHeader = (req.headers.get("X-User-JWT") || "").trim();
    const bodySessionJwt = (sessionJwt || "").trim();
    const authModeHint = (req.headers.get("X-Auth-Mode") || "").trim();

    // Gateway compatibility mode:
    // - Authorization may carry anon key (to satisfy edge gateway verification)
    // - Real user JWT comes in X-User-JWT and is validated below with auth.getUser().
    const authToken = userJwtHeader || bodySessionJwt || authHeaderToken;

    const [purchaseTokenHash, authTokenHash, authHeaderTokenHash, userJwtHeaderHash, bodySessionJwtHash] = await Promise.all([
      tokenFingerprint(purchaseToken),
      tokenFingerprint(authToken),
      tokenFingerprint(authHeaderToken),
      tokenFingerprint(userJwtHeader),
      tokenFingerprint(bodySessionJwt),
    ]);

    console.log("[validate-iap][REQ] payload recebido", {
      platform,
      productId,
      userIdFromBody,
      authModeHint,
      purchaseToken: summarizeTokenForLog(purchaseToken),
      purchaseTokenHash,
      authHeaderToken: summarizeTokenForLog(authHeaderToken),
      authHeaderTokenHash,
      userJwtHeader: summarizeTokenForLog(userJwtHeader),
      userJwtHeaderHash,
      bodySessionJwt: summarizeTokenForLog(bodySessionJwt),
      bodySessionJwtHash,
      authToken: summarizeTokenForLog(authToken),
      authTokenHash,
    });

    if (!platform || !purchaseToken || !productId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: platform, purchaseToken, productId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!authToken) {
      console.warn("[validate-iap][AUTH] Authorization ausente no request.", {
        productId,
        purchaseTokenHash,
      });
      return new Response(
        JSON.stringify({ error: "Missing auth token (Authorization, X-User-JWT or body.sessionJwt)" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ✅ Valida o JWT usando anon key + token do usuário no header
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${authToken}` },
      },
    });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    const authenticatedUserId = authData?.user?.id;

    if (authError || !authenticatedUserId) {
      console.warn("[validate-iap][AUTH] Falha ao validar JWT do request.", {
        authError: authError?.message,
        productId,
        authModeHint,
        authHeaderToken: summarizeTokenForLog(authHeaderToken),
        authHeaderTokenHash,
        userJwtHeader: summarizeTokenForLog(userJwtHeader),
        userJwtHeaderHash,
        bodySessionJwt: summarizeTokenForLog(bodySessionJwt),
        bodySessionJwtHash,
        authToken: summarizeTokenForLog(authToken),
        authTokenHash,
      });

      return new Response(
        JSON.stringify({
          error: "Invalid JWT [edge-auth-getUser]",
          authError: authError?.message ?? "unknown",
          authTokenHash,
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (userIdFromBody && userIdFromBody !== authenticatedUserId) {
      console.warn("[validate-iap][AUTH] userId no body diverge do JWT. Ignorando body e usando JWT.", {
        userIdFromBody,
        authenticatedUserId,
        productId,
        purchaseTokenHash,
      });
    }

    console.log("[validate-iap][AUTH] Usuario autenticado para validacao IAP.", {
      authenticatedUserId,
      productId,
      authModeHint,
      usedTokenSource: userJwtHeader
        ? "X-User-JWT"
        : bodySessionJwt
          ? "body.sessionJwt"
          : "Authorization",
      purchaseTokenHash,
    });

    // ✅ Service role apenas para operações de banco
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    let validation: ValidationResponse = { is_premium: false, platform, product_id: productId };

    // -----------------------------------------------------------------------
    // Android — Google Play Developer API
    // -----------------------------------------------------------------------
    if (platform === "android") {
      const packageName = Deno.env.get("ANDROID_PACKAGE_NAME");
      const serviceAccountKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");

      if (!packageName || !serviceAccountKey) {
        console.error("[Android] Missing env: ANDROID_PACKAGE_NAME or GOOGLE_SERVICE_ACCOUNT_KEY");
        return new Response(
          JSON.stringify({ is_premium: false, error: "Server misconfiguration: missing Android credentials" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        const result = await validateGooglePlaySubscription(
          packageName,
          productId,
          purchaseToken,
          serviceAccountKey
        );
        validation.is_premium = result.isPremium;
        validation.expiry_date = result.expiryDate;
        validation.product_id = result.resolvedProductId || productId;
        if (result.error) validation.error = result.error;
      } catch (err) {
        console.error("[Android] Google Play validation error:", err);
        return new Response(
          JSON.stringify({
            is_premium: false,
            error: err instanceof Error ? err.message : "Google Play validation failed",
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // -----------------------------------------------------------------------
    // iOS — Apple App Store receipt verification
    // -----------------------------------------------------------------------
    else if (platform === "ios") {
      const appleSharedSecret = Deno.env.get("APPLE_SHARED_SECRET");
      const appleVerifyUrl = Deno.env.get("APPLE_VERIFY_URL") || "https://buy.itunes.apple.com/verifyReceipt";

      if (!appleSharedSecret) {
        console.error("[iOS] Missing env: APPLE_SHARED_SECRET");
        return new Response(
          JSON.stringify({ is_premium: false, error: "Server misconfiguration: missing Apple credentials" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        const result = await validateAppleReceipt(purchaseToken, appleSharedSecret, appleVerifyUrl);
        validation.is_premium = result.isPremium;
        validation.expiry_date = result.expiryDate;
        if (result.error) validation.error = result.error;
      } catch (err) {
        console.error("[iOS] Apple validation error:", err);
        return new Response(
          JSON.stringify({
            is_premium: false,
            error: err instanceof Error ? err.message : "Apple validation failed",
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid platform. Must be 'android' or 'ios'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // -----------------------------------------------------------------------
    // Persist result to iap_status table
    // -----------------------------------------------------------------------
    const { error: dbError } = await persistIapStatus(serviceClient, {
      user_id: authenticatedUserId,
      platform,
      product_id: validation.product_id || productId,
      purchase_token: purchaseToken,
      expiry_date: validation.expiry_date ?? null,
      is_premium: validation.is_premium,
      updated_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error("[DB] Failed to upsert iap_status:", dbError);
      validation.error = (validation.error ? validation.error + "; " : "") + "DB write failed";
    }

    return new Response(JSON.stringify(validation), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unhandled validation error:", error);
    return new Response(
      JSON.stringify({
        is_premium: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});