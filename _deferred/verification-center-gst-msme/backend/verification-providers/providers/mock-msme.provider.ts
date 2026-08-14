import type { MsmeVerificationProvider, VerificationCheckResult } from "../verification-provider.interface";

// Udyam Registration Number structure: "UDYAM-" + 2-letter state code + "-" + 2-digit district
// code + "-" + 7-digit serial, e.g. UDYAM-KA-00-0000000. Format check only — a real provider
// (Surepass/Signzy/Decentro) would additionally confirm the number exists in the Udyam registry.
const UDYAM_PATTERN = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/;

export class MockMsmeProvider implements MsmeVerificationProvider {
  readonly name = "mock";

  async verify(udyamNumber: string): Promise<VerificationCheckResult> {
    const normalized = udyamNumber.trim().toUpperCase();

    if (!UDYAM_PATTERN.test(normalized)) {
      return { formatValid: false, reason: "Udyam number does not match the expected UDYAM-XX-00-0000000 format" };
    }

    return {
      formatValid: true,
      providerRef: `mock-msme-${normalized}`,
      details: { stateCode: normalized.slice(6, 8) },
    };
  }
}
