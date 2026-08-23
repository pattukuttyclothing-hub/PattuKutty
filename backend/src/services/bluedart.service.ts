/**
 * Blue Dart Courier Integration Service
 *
 * SPECIFICATION REFERENCE: bluedart-production-hardening-admin.md
 *
 * SECURITY & HARDENING RULES:
 *   - Credentials NEVER leave backend; JWT cached in-memory and auto-refreshed (spec §1, §7, §9)
 *   - All calls are backend-only. No secrets exposed to frontend, React, or logs
 *   - Environment controlled via BLUEDART_ENV (sandbox vs production) without code changes (spec §1, §15)
 *   - Explicit API Separation:
 *       1. authenticate()
 *       2. generateWaybill() / createWaybill()
 *       3. cancelWaybill()
 *       4. registerPickup()
 *       5. cancelPickup()
 *       6. trackShipment() / getTracking()
 *       7. getProductsAndSubProducts() / getProducts()
 *   - Strict pre-flight validation BEFORE calling Blue Dart (no silent fake fallbacks) (spec §3)
 *   - Application-level error checking even on HTTP 200 (spec §4)
 *   - Safe production test guard via BLUEDART_ALLOW_PRODUCTION_TESTS (spec §17)
 */

import { env } from "../config/env.js";
import { XMLParser } from "fast-xml-parser";

// ─── Interfaces & Types ──────────────────────────────────────────────────────

export interface BlueDartConsignee {
  name: string;
  phone: string;
  email?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface BlueDartShipperInfo {
  name: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  originArea: string;     // e.g. "CJB"
  customerCode: string;   // Blue Dart account customer code
  loginId: string;
}

export interface WaybillCreateParams {
  orderId: string;
  orderNo: string;
  paymentMethod: "razorpay" | "cod";
  /** Declared value in rupees (not paise) */
  declaredValue: number;
  /** COD amount in rupees — required for COD orders */
  codAmount?: number;
  consignee: BlueDartConsignee;
  /** Approximate weight in kg — default 0.5kg */
  weightKg?: number;
  /** Number of pieces — default 1 */
  pieces?: number;
  /** Optional custom dispatch pickup date */
  pickupDate?: string;
  /** Optional custom dispatch pickup time HHMM */
  pickupTime?: string;
  expectedDeliveryDate?: string;
}

export interface BlueDartShipmentResult {
  awb: string;
  blueDartReference?: string;
  trackingUrl: string;
  expectedDelivery?: string;
}

export interface PickupRegistrationParams {
  awb: string;
  pickupDate: string; // YYYY-MM-DD
  pickupTime: string; // HHMM (e.g. "1400")
  pieces: number;
  weightKg: number;
  consigneeName: string;
  consigneeAddress: string;
  consigneePincode: string;
  consigneePhone: string;
  subProducts?: string;
}

export interface BlueDartPickupResult {
  registered: boolean;
  pickupToken?: string;
  reason?: string;
}

export interface PickupCancellationParams {
  awb?: string;
  pickupToken: string | number;
  pickupDate?: string | number | Date;
  reason?: string;
}

export interface BlueDartProduct {
  productName: string;
  productDescription?: string | null;
  subProducts?: string[];
  productCode?: string;
  subProductCode?: string;
  subProductName?: string;
}

export interface BlueDartTrackingEvent {
  status: string;
  location: string;
  detail: string;
  timestamp: string;
}

export interface BlueDartHealthStatus {
  configured: boolean;
  environment: "sandbox" | "production";
  loginIdConfigured: boolean;
  licenseKeyConfigured: boolean;
  originAreaConfigured: boolean;
  customerCodeConfigured: boolean;
  allowProductionTests: boolean;
}

// ─── Internal State ─────────────────────────────────────────────────────────

let _cachedJwt: string | null = null;
let _jwtExpiresAt: number = 0;

/** Invalidate cached JWT token */
export function invalidateJwt(): void {
  _cachedJwt = null;
  _jwtExpiresAt = 0;
}

/** Validates pincode string against 6-digit Indian postal code format */
export function isValidPincode(pincode: string | null | undefined): boolean {
  if (!pincode || typeof pincode !== "string") return false;
  return /^[1-9][0-9]{5}$/.test(pincode.trim());
}

/**
 * Validates if an AWB string is syntactically valid.
 * Spec §8: Must not be null, undefined, empty, "null", "undefined", or invalid length.
 */
export function isValidAwb(awb: string | null | undefined): boolean {
  if (!awb || typeof awb !== "string") return false;
  const trimmed = awb.trim();
  if (trimmed === "" || trimmed === "null" || trimmed === "undefined") return false;
  if (trimmed.length < 4 || trimmed.length > 50) return false;
  return true;
}

/** Wraps a date or timestamp into Blue Dart's required /Date(ms)/ string format */
export function toBlueDartDate(dateInput?: string | number | Date | null): string {
  if (!dateInput) {
    return `/Date(${Date.now()})/`;
  }
  if (typeof dateInput === "number") {
    return `/Date(${dateInput})/`;
  }
  if (dateInput instanceof Date) {
    return `/Date(${dateInput.getTime()})/`;
  }
  const parsed = new Date(dateInput).getTime();
  return `/Date(${isNaN(parsed) ? Date.now() : parsed})/`;
}


/**
 * Assets presence of credentials and returns configured Blue Dart URLs per environment.
 * Controlled strictly by BLUEDART_ENV (sandbox vs production) with optional URL overrides.
 */
export function assertCredentials(): {
  loginId: string;
  licenseKey: string;
  apiKey?: string;
  apiSecret?: string;
  apiType: string;
  apiUrl: string;
  authUrl: string;
  waybillUrl: string;
  pickupUrl: string;
  trackingUrl: string;
  cancelWaybillUrl: string;
  cancelPickupUrl: string;
  productUrl: string;
  envMode: "sandbox" | "production";
} {
  const loginId = env.BLUEDART_CLIENT_ID || env.BLUEDART_LOGIN_ID || env.BLUEDART_API_KEY;
  const licenseKey = env.BLUEDART_CLIENT_SECRET || env.BLUEDART_LICENSE_KEY || env.BLUEDART_LICENCE_KEY || env.BLUEDART_API_SECRET;
  const apiKey = loginId;
  const apiSecret = licenseKey;
  const apiType = env.BLUEDART_API_TYPE || "S";
  const apiUrl = env.BLUEDART_API_URL;
  const envMode = env.BLUEDART_ENV || "sandbox";

  if (!loginId || !licenseKey) {
    const err = new Error(
      "Blue Dart credentials not configured. " +
      "Set BLUEDART_CLIENT_ID and BLUEDART_CLIENT_SECRET in backend environment. " +
      "Integration is CODE COMPLETE — CONFIGURATION PENDING."
    ) as Error & { statusCode: number; code: string };
    err.statusCode = 503;
    err.code = "BLUEDART_CONFIG_MISSING";
    throw err;
  }

  // Official Gateway endpoints per environment
  const defaultAuthBase = envMode === "production"
    ? "https://apigateway.bluedart.com/in/transportation/token/v1/login"
    : "https://apigateway-sandbox.bluedart.com/in/transportation/token/v1/login";

  const defaultTrackingBase = envMode === "production"
    ? "https://apigateway.bluedart.com/in/transportation/tracking/v1"
    : "https://apigateway-sandbox.bluedart.com/in/transportation/tracking/v1";

  const defaultWaybillBase = envMode === "production"
    ? "https://apigateway.bluedart.com/in/transportation/waybill/v1/GenerateWayBill"
    : "https://apigateway-sandbox.bluedart.com/in/transportation/waybill/v1/GenerateWayBill";

  const defaultPickupBase = envMode === "production"
    ? "https://apigateway.bluedart.com/in/transportation/pickup/v1/RegisterPickup"
    : "https://apigateway-sandbox.bluedart.com/in/transportation/pickup/v1/RegisterPickup";

  const defaultCancelPickupBase = envMode === "production"
    ? "https://apigateway.bluedart.com/in/transportation/cancel-pickup/v1/CancelPickup"
    : "https://apigateway-sandbox.bluedart.com/in/transportation/cancel-pickup/v1/CancelPickup";

  const defaultProductBase = envMode === "production"
    ? "https://apigateway.bluedart.com/in/transportation/allproduct/v1/GetAllProductsAndSubProducts"
    : "https://apigateway-sandbox.bluedart.com/in/transportation/allproduct/v1/GetAllProductsAndSubProducts";

  const authUrl = env.BLUEDART_AUTH_BASE_URL || defaultAuthBase;
  const waybillUrl = env.BLUEDART_WAYBILL_BASE_URL || defaultWaybillBase;
  const pickupUrl = env.BLUEDART_PICKUP_BASE_URL || defaultPickupBase;
  const trackingUrl = env.BLUEDART_TRACKING_BASE_URL || defaultTrackingBase;
  const cancelWaybillUrl = `${env.BLUEDART_WAYBILL_BASE_URL || apiUrl}/WaybillGeneration/waybillManifestGenerationLatest/CancelWaybill`;
  const cancelPickupUrl = env.BLUEDART_CANCEL_PICKUP_BASE_URL || defaultCancelPickupBase;
  const productUrl = env.BLUEDART_PRODUCT_BASE_URL || defaultProductBase;

  return {
    loginId,
    licenseKey,
    apiKey,
    apiSecret,
    apiType,
    apiUrl,
    authUrl,
    waybillUrl,
    pickupUrl,
    trackingUrl,
    cancelWaybillUrl,
    cancelPickupUrl,
    productUrl,
    envMode,
  };
}

export function isBlueDartConfigured(): boolean {
  const loginId = env.BLUEDART_CLIENT_ID || env.BLUEDART_LOGIN_ID || env.BLUEDART_API_KEY;
  const licenseKey = env.BLUEDART_CLIENT_SECRET || env.BLUEDART_LICENSE_KEY || env.BLUEDART_LICENCE_KEY || env.BLUEDART_API_SECRET;
  return Boolean(loginId && licenseKey);
}

export function getShipperInfo(): BlueDartShipperInfo {
  const { loginId } = assertCredentials();
  const originArea = env.BLUEDART_ORIGIN_AREA;
  const customerCode = env.BLUEDART_CUSTOMER_CODE || loginId;

  if (!originArea || !customerCode) {
    const err = new Error(
      "Blue Dart shipper configuration incomplete. " +
      "Set BLUEDART_ORIGIN_AREA and BLUEDART_CUSTOMER_CODE in environment configuration."
    ) as Error & { statusCode: number; code: string };
    err.statusCode = 503;
    err.code = "BLUEDART_SHIPPER_CONFIG_MISSING";
    throw err;
  }

  return {
    name: "Butterflies Tailoring",
    line1: "12A, Ramanathapuram, 3rd Street, Gandhipuram",
    city: "Coimbatore",
    state: "Tamil Nadu",
    pincode: "641012",
    phone: "9876543210",
    originArea: originArea.trim(),
    customerCode: customerCode.trim(),
    loginId: loginId.trim(),
  };
}

/** Check health and configuration status without exposing credentials */
export function getBlueDartHealth(): BlueDartHealthStatus {
  return {
    configured: isBlueDartConfigured(),
    environment: env.BLUEDART_ENV || "sandbox",
    loginIdConfigured: Boolean(env.BLUEDART_CLIENT_ID || env.BLUEDART_LOGIN_ID || env.BLUEDART_API_KEY),
    licenseKeyConfigured: Boolean(env.BLUEDART_CLIENT_SECRET || env.BLUEDART_LICENSE_KEY || env.BLUEDART_LICENCE_KEY || env.BLUEDART_API_SECRET),
    originAreaConfigured: Boolean(env.BLUEDART_ORIGIN_AREA),
    customerCodeConfigured: Boolean(env.BLUEDART_CUSTOMER_CODE || env.BLUEDART_CLIENT_ID || env.BLUEDART_LOGIN_ID),
    allowProductionTests: Boolean(env.BLUEDART_ALLOW_PRODUCTION_TESTS),
  };
}

// ─── Authentication ──────────────────────────────────────────────────────────

/**
 * Obtains Blue Dart JWT according to official API Gateway contract.
 * Caches token in-memory and refreshes 5 minutes before expiry.
 * Token is backend-only and NEVER returned to frontend.
 */
export async function authenticate(): Promise<string> {
  const now = Date.now();

  if (_cachedJwt && _jwtExpiresAt > now + 5 * 60 * 1000) {
    return _cachedJwt;
  }

  const { loginId, licenseKey, authUrl } = assertCredentials();
  const timeoutMs = env.BLUEDART_TIMEOUT_MS || 10000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(authUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "ClientID": loginId,
        "clientSecret": licenseKey,
      },
      signal: controller.signal,
    });
  } catch (networkErr) {
    const isTimeout = (networkErr as { name?: string }).name === "AbortError";
    const msg = isTimeout
      ? `Blue Dart authentication timed out after ${timeoutMs}ms`
      : `Blue Dart authentication network error: ${String(networkErr)}`;
    const err = new Error(msg) as Error & { statusCode: number };
    err.statusCode = 502;
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "(unreadable body)");
    console.error("[BlueDart] Auth HTTP error:", res.status, text);
    const err = new Error(
      "Blue Dart authentication failed. Check credentials and network connectivity."
    ) as Error & { statusCode: number };
    err.statusCode = 502;
    throw err;
  }

  const data = (await res.json()) as {
    JWTToken?: string;
    TokenExpiry?: string;
    IsError?: boolean;
    Status?: { StatusMessage?: string }[];
  };

  const token = data.JWTToken || res.headers.get("jwttoken");

  if (data.IsError || !token) {
    const msg = data.Status?.[0]?.StatusMessage ?? "Unknown auth error";
    console.error("[BlueDart] Auth error response message:", msg);
    const err = new Error(`Blue Dart authentication error: ${msg}`) as Error & { statusCode: number };
    err.statusCode = 502;
    throw err;
  }

  _cachedJwt = token;
  _jwtExpiresAt = data.TokenExpiry
    ? new Date(data.TokenExpiry).getTime()
    : now + 23 * 60 * 60 * 1000;

  return _cachedJwt;
}

/** Internal fetch helper with JWT retry on HTTP 401 */
async function fetchWithJwtRetry(
  url: string,
  options: { method?: string; headers?: Record<string, string>; body?: string }
): Promise<Response> {
  let jwt = await authenticate();

  const requestHeaders: Record<string, string> = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "JWTToken": jwt,
    ...(options.headers || {}),
  };

  const timeoutMs = env.BLUEDART_TIMEOUT_MS || 10000;
  let controller = new AbortController();
  let timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers: requestHeaders, signal: controller.signal });
  } catch (err) {
    clearTimeout(timer);
    const isTimeout = (err as { name?: string }).name === "AbortError";
    throw new Error(isTimeout ? `Blue Dart API call timed out after ${timeoutMs}ms` : String(err));
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401) {
    console.warn("[BlueDart] JWT unauthorized (HTTP 401). Retrying with fresh JWT...");
    invalidateJwt();
    jwt = await authenticate();
    requestHeaders["JWTToken"] = jwt;

    controller = new AbortController();
    timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      res = await fetch(url, { ...options, headers: requestHeaders, signal: controller.signal });
    } catch (err) {
      clearTimeout(timer);
      const isTimeout = (err as { name?: string }).name === "AbortError";
      throw new Error(isTimeout ? `Blue Dart API retry timed out after ${timeoutMs}ms` : String(err));
    } finally {
      clearTimeout(timer);
    }
  }

  return res;
}

export function buildTrackingUrl(awb: string): string {
  return `https://www.bluedart.com/tracking?handler=tnt&action=awbquery&awb=${encodeURIComponent(awb)}`;
}

// ─── Pre-Flight Input Validation (spec §3) ──────────────────────────────────

export function validateWaybillParams(params: WaybillCreateParams): void {
  // Production test execution guard (spec §17)
  if (env.BLUEDART_ENV === "production" && process.env.NODE_ENV === "test" && !env.BLUEDART_ALLOW_PRODUCTION_TESTS) {
    const err = new Error(
      "Production Blue Dart API calls are BLOCKED during automated tests. " +
      "Set BLUEDART_ALLOW_PRODUCTION_TESTS=true to explicitly allow testing against production credentials."
    ) as Error & { statusCode: number };
    err.statusCode = 403;
    throw err;
  }

  if (!params.orderId?.trim()) {
    const err = new Error("Order ID is required for shipment creation.") as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  if (!params.orderNo?.trim()) {
    const err = new Error("Order Number is required for shipment creation.") as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  const c = params.consignee;
  if (!c) {
    const err = new Error("Consignee information is required for shipment creation.") as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  if (!c.name?.trim() || c.name.trim().length < 2) {
    const err = new Error("Consignee full name is required and must be at least 2 characters.") as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  const cleanPhone = (c.phone ?? "").replace(/\s/g, "");
  if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 15) {
    const err = new Error("Consignee valid mobile number is required (10-15 digits).") as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  if (!c.line1?.trim()) {
    const err = new Error("Consignee address line 1 is required.") as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  if (!c.city?.trim()) {
    const err = new Error("Consignee city is required.") as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  if (!c.state?.trim()) {
    const err = new Error("Consignee state is required.") as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  if (!isValidPincode(c.pincode)) {
    const err = new Error("Consignee pincode must be a valid 6-digit Indian postal code.") as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  if (!params.declaredValue || params.declaredValue <= 0) {
    const err = new Error("Shipment declared value must be greater than zero.") as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  if (params.paymentMethod === "cod") {
    if (params.codAmount === undefined || params.codAmount <= 0) {
      const err = new Error("COD shipment requires a valid positive collectable COD amount.") as Error & { statusCode: number };
      err.statusCode = 400;
      throw err;
    }
  }

  // Validate shipper config presence
  getShipperInfo();
}

// ─── API Method 1: Generate Waybill (spec §3, §4) ─────────────────────────

export async function generateWaybill(params: WaybillCreateParams): Promise<BlueDartShipmentResult> {
  validateWaybillParams(params);

  const { loginId, licenseKey, apiType, waybillUrl } = assertCredentials();
  const shipper = getShipperInfo();

  let productCode: string;
  if (params.paymentMethod === "cod") {
    const codCode = env.BLUEDART_COD_PRODUCT_CODE;
    if (!codCode) {
      const err = new Error(
        "Blue Dart COD product code not configured. Set BLUEDART_COD_PRODUCT_CODE."
      ) as Error & { statusCode: number; code: string };
      err.statusCode = 503;
      err.code = "BLUEDART_COD_NOT_CONFIGURED";
      throw err;
    }
    productCode = codCode;
  } else {
    productCode = env.BLUEDART_PREPAID_PRODUCT_CODE;
  }

  const isCod = params.paymentMethod === "cod";
  const weightKg = params.weightKg ?? 0.5;
  const pieces = params.pieces ?? 1;

  const waybillPayload = {
    Request: {
      Consignee: {
        ConsigneeName: params.consignee.name.trim(),
        ConsigneeAddress1: params.consignee.line1.trim(),
        ConsigneeAddress2: params.consignee.line2?.trim() ?? "",
        ConsigneeAddress3: "",
        ConsigneePincode: params.consignee.pincode.trim(),
        ConsigneePhone: params.consignee.phone.trim(),
        ConsigneeMobile: params.consignee.phone.trim(),
        ConsigneeEmailID: params.consignee.email?.trim() ?? "",
      },
      Shipper: {
        OriginArea: shipper.originArea,
        CustomerCode: shipper.customerCode,
        CustomerName: shipper.name,
        CustomerAddress1: shipper.line1,
        CustomerPincode: shipper.pincode,
        Sender: shipper.name,
      },
      Services: {
        AWBNo: "",
        ProductCode: productCode,
        SubProductCode: isCod ? "C" : "P",
        ActualWeight: weightKg,
        CollectableAmount: isCod ? (params.codAmount ?? 0) : 0,
        Commodity: {
          CommodityDetail1: `Order ${params.orderNo}`,
          CommodityDetail2: "Ethnic wear / tailoring",
          CommodityDetail3: "",
        },
        DeclaredValue: params.declaredValue,
        Dimensions: [],
        PieceCount: pieces.toString(),
        InvoiceNo: params.orderNo,
        PackType: "BOX",
        PickupDate: toBlueDartDate(params.pickupDate),
        PickupTime: params.pickupTime ?? "1200",
        ProductType: 1,
        PayableAt: "",
        SpecialInstruction: "",
      },
      Returnadds: {
        ManifestNumber: "",
        ReturnContact: shipper.name,
        ReturnAddress1: shipper.line1,
        ReturnPincode: shipper.pincode,
        ReturnTelephone: shipper.phone,
        ReturnMobile: shipper.phone,
        ReturnEmailID: "",
      },
    },
    Profile: {
      LoginID: loginId,
      LicenceKey: licenseKey,
      Api_type: apiType,
    },
  };

  let waybillRes: Response;
  try {
    waybillRes = await fetchWithJwtRetry(waybillUrl, {
      method: "POST",
      body: JSON.stringify(waybillPayload),
    });
  } catch (networkErr) {
    const err = new Error(`Blue Dart waybill API network error: ${String(networkErr)}`) as Error & { statusCode: number };
    err.statusCode = 502;
    throw err;
  }

  if (!waybillRes.ok) {
    const text = await waybillRes.text().catch(() => "(unreadable body)");
    console.error("[BlueDart] Waybill creation HTTP error:", waybillRes.status, text);
    const err = new Error(
      `Blue Dart waybill creation failed (HTTP ${waybillRes.status}). ` +
      "The order has NOT been marked as shipped. Please retry."
    ) as Error & { statusCode: number };
    err.statusCode = 502;
    throw err;
  }

  const rawBody = (await waybillRes.json()) as {
    GenerateWayBillResult?: {
      AWBNo?: string;
      IsError?: boolean;
      Status?: { StatusMessage?: string; StatusCode?: string }[];
      ErrorMessage?: { ErrorCode?: string; ErrorDescription?: string }[];
    };
  };

  const waybillResult = rawBody.GenerateWayBillResult;

  // Response validation even on HTTP 200 (spec §4)
  if (!waybillResult || waybillResult.IsError || !isValidAwb(waybillResult.AWBNo)) {
    const msg =
      waybillResult?.Status?.[0]?.StatusMessage ??
      waybillResult?.ErrorMessage?.[0]?.ErrorDescription ??
      "Waybill generation returned an error from Blue Dart";
    console.error("[BlueDart] Waybill application error response:", msg);
    const err = new Error(`Blue Dart waybill error: ${msg}. Order has NOT been marked as shipped.`) as Error & { statusCode: number };
    err.statusCode = 502;
    throw err;
  }

  const awb = waybillResult.AWBNo!.trim();
  return {
    awb,
    blueDartReference: awb,
    trackingUrl: buildTrackingUrl(awb),
  };
}

/** Exported alias for backwards compatibility */
export const createWaybill = generateWaybill;

// ─── API Method 2: Register Pickup (spec §8) ─────────────────────────────

export async function registerPickup(params: PickupRegistrationParams): Promise<BlueDartPickupResult> {
  if (!isValidAwb(params.awb)) {
    return { registered: false, reason: "Invalid AWB number provided for pickup registration." };
  }

  if (!params.pickupDate || !params.pickupTime) {
    return { registered: false, reason: "Pickup date and time are required." };
  }

  try {
    const { loginId, licenseKey, apiType, pickupUrl } = assertCredentials();
    const shipper = getShipperInfo();

    const payload = {
      request: {
        AWBNo: [params.awb.trim()],
        AreaCode: shipper.originArea,
        ContactPersonName: shipper.name,
        CustomerAddress1: shipper.line1,
        CustomerAddress2: "",
        CustomerAddress3: "",
        CustomerCode: shipper.customerCode,
        CustomerName: shipper.name,
        CustomerPincode: shipper.pincode,
        CustomerTelephoneNumber: shipper.phone,
        MobileTelNo: shipper.phone,
        DoxNDox: "1",
        EmailID: "",
        IsForcePickup: false,
        IsReversePickup: false,
        NumberofPieces: Number(params.pieces || 1),
        OfficeCloseTime: "1800",
        PackType: "BOX",
        ProductCode: env.BLUEDART_PREPAID_PRODUCT_CODE || "A",
        ReferenceNo: "",
        Remarks: "",
        RouteCode: "",
        ShipmentPickupDate: params.pickupDate.trim(),
        ShipmentPickupTime: params.pickupTime.trim(),
        SubProducts: params.subProducts ? [params.subProducts] : ["E-Tailing"],
        VolumeWeight: 0.5,
        WeightofShipment: Number(params.weightKg || 0.5),
        isToPayShipper: false,
        CISDDN: false,
      },
      profile: {
        LoginID: loginId,
        LicenceKey: licenseKey,
        Api_type: apiType,
      },
    };

    const res = await fetchWithJwtRetry(pickupUrl, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[BlueDart] Pickup registration HTTP error:", res.status, text);
      return { registered: false, reason: `HTTP ${res.status} from Blue Dart pickup API` };
    }

    const data = (await res.json()) as {
      RegisterPickupResult?: {
        IsError?: boolean;
        TokenNumber?: string;
        Status?: { StatusCode?: number; StatusInformation?: string }[];
      };
    };

    const result = data.RegisterPickupResult;
    if (!result || result.IsError) {
      const reason = result?.Status?.[0]?.StatusInformation ?? "Blue Dart returned error on pickup registration";
      console.warn("[BlueDart] Pickup registration rejected by Blue Dart:", reason);
      return { registered: false, reason };
    }

    if (!result.TokenNumber || typeof result.TokenNumber !== "string" || result.TokenNumber.trim() === "") {
      console.warn("[BlueDart] Pickup registration returned no TokenNumber despite IsError: false");
      return { registered: false, reason: "Blue Dart returned no TokenNumber despite IsError: false" };
    }

    return { registered: true, pickupToken: result.TokenNumber.trim() };
  } catch (err) {
    console.error("[BlueDart] registerPickup exception:", err);
    return { registered: false, reason: String(err) };
  }
}

// ─── API Method 3: Cancel Waybill (spec §11) ──────────────────────────────

export async function cancelWaybill(awb: string): Promise<{ cancelled: boolean; reason?: string }> {
  if (!isValidAwb(awb)) {
    return { cancelled: false, reason: "Invalid AWB number provided for cancellation." };
  }

  try {
    const { loginId, licenseKey, apiType, cancelWaybillUrl } = assertCredentials();

    const res = await fetchWithJwtRetry(cancelWaybillUrl, {
      method: "POST",
      body: JSON.stringify({
        AWBNo: awb.trim(),
        Profile: {
          LoginID: loginId,
          LicenceKey: licenseKey,
          Api_type: apiType,
          Version: "1.3",
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[BlueDart] Waybill cancel HTTP error:", res.status, text);
      return { cancelled: false, reason: `HTTP ${res.status} from Blue Dart cancellation API` };
    }

    const data = (await res.json()) as {
      IsError?: boolean;
      Status?: { StatusMessage?: string }[];
    };

    if (data.IsError) {
      const reason = data.Status?.[0]?.StatusMessage ?? "Blue Dart returned error on waybill cancellation";
      console.warn("[BlueDart] Waybill cancellation failed:", reason);
      return { cancelled: false, reason };
    }

    return { cancelled: true };
  } catch (err) {
    console.error("[BlueDart] cancelWaybill exception:", err);
    return { cancelled: false, reason: String(err) };
  }
}

// ─── API Method 4: Cancel Pickup (spec §12) ───────────────────────────────

export async function cancelPickup(params: PickupCancellationParams): Promise<{ cancelled: boolean; reason?: string }> {
  const tokenNum = typeof params.pickupToken === "number"
    ? params.pickupToken
    : parseInt(String(params.pickupToken || ""), 10);

  if (isNaN(tokenNum) || tokenNum <= 0) {
    return { cancelled: false, reason: "Valid numeric TokenNumber is required for pickup cancellation." };
  }

  try {
    const { loginId, licenseKey, apiType, cancelPickupUrl } = assertCredentials();

    if (params.awb) {
      console.log(`[BlueDart] Initiating pickup cancellation for AWB ${params.awb.trim()} (Token: ${tokenNum})`);
    }

    const res = await fetchWithJwtRetry(cancelPickupUrl, {
      method: "POST",
      body: JSON.stringify({
        request: {
          TokenNumber: tokenNum,
          PickupRegistrationDate: toBlueDartDate(params.pickupDate),
          Remarks: params.reason ?? "Pickup cancelled by admin",
        },
        profile: {
          LoginID: loginId,
          LicenceKey: licenseKey,
          Api_type: apiType,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[BlueDart] Pickup cancel HTTP error:", res.status, text);
      return { cancelled: false, reason: `HTTP ${res.status} from Blue Dart pickup cancellation API` };
    }

    const data = (await res.json()) as {
      CancelPickupResult?: {
        IsError?: boolean;
        Status?: { StatusCode?: string; StatusInformation?: string }[];
      };
    };

    const result = data?.CancelPickupResult;
    if (!result) {
      console.error("[BlueDart] Pickup cancellation returned unexpected response shape:", data);
      return { cancelled: false, reason: "Blue Dart returned an unexpected response shape for pickup cancellation." };
    }

    const isErr = result.IsError ?? false;
    if (isErr) {
      const reason = result.Status?.[0]?.StatusInformation ?? "Blue Dart returned error on pickup cancellation";
      console.warn("[BlueDart] Pickup cancellation failed:", reason);
      return { cancelled: false, reason };
    }

    return { cancelled: true };
  } catch (err) {
    console.error("[BlueDart] cancelPickup exception:", err);
    return { cancelled: false, reason: String(err) };
  }
}

// ─── API Method 5: Track Shipment (spec §9, §10) ──────────────────────────

export async function trackShipment(awb: string): Promise<BlueDartTrackingEvent[]> {
  if (!isValidAwb(awb)) {
    return [];
  }

  const { loginId, licenseKey, trackingUrl } = assertCredentials();

  const query = new URLSearchParams({
    handler: "tnt",
    action: "custawbquery",
    loginid: loginId,
    lickey: licenseKey,
    awb: "awb",
    numbers: awb.trim(),
    format: "xml",
    scan: "1",
    verno: "1",
  });

  const fullUrl = `${trackingUrl}/shipment?${query.toString()}`;

  let res: Response;
  try {
    res = await fetchWithJwtRetry(fullUrl, { method: "GET" });
  } catch (networkErr) {
    throw new Error(`Blue Dart tracking network error: ${String(networkErr)}`);
  }

  if (!res.ok) {
    throw new Error(`Blue Dart tracking failed: HTTP ${res.status}`);
  }

  const xmlText = await res.text();
  if (!xmlText || !xmlText.includes("<ShipmentData>")) {
    return [];
  }

  try {
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const parsed = parser.parse(xmlText) as {
      ShipmentData?: {
        Shipment?: {
          Status?: string;
          Instructions?: string;
          Scans?: {
            ScanDetail?: Array<{
              Scan?: string;
              ScanCode?: string;
              ScanDate?: string;
              ScanTime?: string;
              ScannedLocation?: string;
            }> | {
              Scan?: string;
              ScanCode?: string;
              ScanDate?: string;
              ScanTime?: string;
              ScannedLocation?: string;
            };
          };
        } | Array<unknown>;
      };
    };

    const shipment = Array.isArray(parsed.ShipmentData?.Shipment)
      ? (parsed.ShipmentData?.Shipment[0] as Record<string, unknown> | undefined)
      : (parsed.ShipmentData?.Shipment as Record<string, unknown> | undefined);

    if (!shipment) return [];

    const instructions = String(shipment.Instructions ?? "").trim();
    const rawScans = (shipment.Scans as { ScanDetail?: unknown } | undefined)?.ScanDetail;
    const scanDetails = Array.isArray(rawScans) ? rawScans : rawScans ? [rawScans] : [];

    const events: BlueDartTrackingEvent[] = [];
    for (const rawScan of scanDetails) {
      const scan = rawScan as {
        Scan?: string;
        ScannedLocation?: string;
        ScanDate?: string;
        ScanTime?: string;
      };

      events.push({
        status: String(scan.Scan ?? "").trim(),
        location: String(scan.ScannedLocation ?? "").trim(),
        detail: instructions || String(scan.Scan ?? "").trim(),
        timestamp: scan.ScanDate
          ? `${scan.ScanDate}T${scan.ScanTime ?? "00:00:00"}`
          : new Date().toISOString(),
      });
    }

    return events;
  } catch (err) {
    console.error("[BlueDart] XML parse error in trackShipment:", err);
    return [];
  }
}

/** Exported alias for backwards compatibility */
export const getTracking = trackShipment;

// ─── API Method 6: Get Products & Sub-Products (spec §2) ──────────────────

export async function getProductsAndSubProducts(): Promise<BlueDartProduct[]> {
  try {
    const { loginId, licenseKey, apiType, productUrl } = assertCredentials();

    const res = await fetchWithJwtRetry(productUrl, {
      method: "POST",
      body: JSON.stringify({
        profile: {
          LoginID: loginId,
          LicenceKey: licenseKey,
          Api_type: apiType,
        },
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as {
        GetAllProductsAndSubProductsResult?: {
          IsError?: boolean;
          ErrorMessage?: string | null;
          ProductList?: {
            ProductName: string;
            ProductDescription: string | null;
            SubProducts?: string[];
          }[];
        };
      };

      const result = data?.GetAllProductsAndSubProductsResult;
      if (result && !result.IsError && Array.isArray(result.ProductList)) {
        return result.ProductList.map((p) => ({
          productName: p.ProductName,
          productDescription: p.ProductDescription ?? null,
          subProducts: Array.isArray(p.SubProducts) ? p.SubProducts : [],
          productCode: p.ProductName,
        }));
      }
    }
  } catch (err) {
    console.warn("[BlueDart] getProducts master query fallback:", err);
  }

  // Fallback to configured codes
  return [
    { productName: "Dart Apex / Prepaid", productCode: env.BLUEDART_PREPAID_PRODUCT_CODE },
    ...(env.BLUEDART_COD_PRODUCT_CODE ? [{ productName: "COD Product", productCode: env.BLUEDART_COD_PRODUCT_CODE }] : []),
  ];
}

/** Exported alias for backwards compatibility */
export const getProducts = getProductsAndSubProducts;
