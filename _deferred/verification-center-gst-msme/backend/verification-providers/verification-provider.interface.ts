// Result of a provider's registration-number check. `formatValid` is a pure format/checksum
// verdict — even when true, this NEVER approves anything on its own. It only decides whether a
// submission is even worth queuing for admin review. Approval is always a separate, explicit
// admin action (see verification.service.ts) — "Do NOT automatically approve uploaded documents."
export interface VerificationCheckResult {
  formatValid: boolean;
  reason?: string;
  providerRef?: string;
  details?: Record<string, unknown>;
}

export interface GstVerificationProvider {
  readonly name: string;
  verify(gstin: string): Promise<VerificationCheckResult>;
}

export interface MsmeVerificationProvider {
  readonly name: string;
  verify(udyamNumber: string): Promise<VerificationCheckResult>;
}
