import type { MsmeVerificationProvider, VerificationCheckResult } from "../verification-provider.interface";

// Real adapter for Surepass's Udyam/MSME verification API
// (https://surepass.io/udyog-aadhaar-udyam-verification-api/). Only instantiated when
// MSME_PROVIDER=surepass and MSME_API_KEY is set — see verification-provider.factory.ts.
// Structurally ready; fill in the response-shape mapping once a real Surepass account/sandbox
// response is available.
export class SurepassMsmeProvider implements MsmeVerificationProvider {
  readonly name = "surepass";

  constructor(private readonly apiKey: string) {}

  async verify(udyamNumber: string): Promise<VerificationCheckResult> {
    const res = await fetch("https://kyc-api.surepass.io/api/v1/corporate/udyam", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ id_number: udyamNumber }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`[verification] Surepass MSME check failed (${res.status}): ${body}`);
    }

    const json = (await res.json()) as { success?: boolean; data?: Record<string, unknown> };

    return {
      formatValid: Boolean(json.success),
      providerRef: udyamNumber,
      details: json.data,
    };
  }
}
