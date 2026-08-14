import { env } from "../../config/env";
import type { GstVerificationProvider, MsmeVerificationProvider } from "./verification-provider.interface";
import { MockGstProvider } from "./providers/mock-gst.provider";
import { MockMsmeProvider } from "./providers/mock-msme.provider";
import { SurepassGstProvider } from "./providers/surepass-gst.provider";
import { SurepassMsmeProvider } from "./providers/surepass-msme.provider";

let cachedGst: GstVerificationProvider | null = null;
let cachedMsme: MsmeVerificationProvider | null = null;

// Same one-place-to-swap pattern as otp-provider.factory.ts. Signzy/Decentro adapters plug in
// here the same way Surepass did: implement the interface, add a case, point *_PROVIDER at it.
export function getGstProvider(): GstVerificationProvider {
  if (cachedGst) return cachedGst;

  if (env.GST_PROVIDER === "surepass" && env.GST_API_KEY) {
    cachedGst = new SurepassGstProvider(env.GST_API_KEY);
    return cachedGst;
  }

  if (env.GST_PROVIDER === "surepass") {
    console.warn("[verification] GST_PROVIDER=surepass but GST_API_KEY is not set — falling back to mock provider");
  }

  cachedGst = new MockGstProvider();
  return cachedGst;
}

export function getMsmeProvider(): MsmeVerificationProvider {
  if (cachedMsme) return cachedMsme;

  if (env.MSME_PROVIDER === "surepass" && env.MSME_API_KEY) {
    cachedMsme = new SurepassMsmeProvider(env.MSME_API_KEY);
    return cachedMsme;
  }

  if (env.MSME_PROVIDER === "surepass") {
    console.warn("[verification] MSME_PROVIDER=surepass but MSME_API_KEY is not set — falling back to mock provider");
  }

  cachedMsme = new MockMsmeProvider();
  return cachedMsme;
}

// Test/DI hook.
export function resetVerificationProviderCache(): void {
  cachedGst = null;
  cachedMsme = null;
}
