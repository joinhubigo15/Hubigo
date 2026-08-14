import type { GstVerificationProvider, VerificationCheckResult } from "../verification-provider.interface";

// Real adapter for Surepass's GSTIN verification API (https://surepass.io/gst-verification-api/).
// Only instantiated when GST_PROVIDER=surepass and GST_API_KEY is set — see
// verification-provider.factory.ts. Structurally ready; fill in the response-shape mapping once
// a real Surepass account/sandbox response is available.
export class SurepassGstProvider implements GstVerificationProvider {
  readonly name = "surepass";

  constructor(private readonly apiKey: string) {}

  async verify(gstin: string): Promise<VerificationCheckResult> {
    const res = await fetch("https://kyc-api.surepass.io/api/v1/corporate/gstin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ id_number: gstin }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`[verification] Surepass GST check failed (${res.status}): ${body}`);
    }

    const json = (await res.json()) as { success?: boolean; data?: Record<string, unknown> };

    return {
      formatValid: Boolean(json.success),
      providerRef: gstin,
      details: json.data,
    };
  }
}
