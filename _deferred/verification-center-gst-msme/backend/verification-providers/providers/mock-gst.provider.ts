import type { GstVerificationProvider, VerificationCheckResult } from "../verification-provider.interface";

// GSTIN structure: 2-digit state code + 10-char PAN + 1-digit entity code + 'Z' (fixed) +
// 1-char checksum. This is a format check only, standing in for a real GSTIN lookup API
// (Surepass/Signzy/Decentro) — see mock-msme.provider.ts for the same pattern.
const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export class MockGstProvider implements GstVerificationProvider {
  readonly name = "mock";

  async verify(gstin: string): Promise<VerificationCheckResult> {
    const normalized = gstin.trim().toUpperCase();

    if (!GSTIN_PATTERN.test(normalized)) {
      return { formatValid: false, reason: "GSTIN does not match the expected 15-character format" };
    }

    return {
      formatValid: true,
      providerRef: `mock-gst-${normalized}`,
      details: { stateCode: normalized.slice(0, 2), pan: normalized.slice(2, 12) },
    };
  }
}
