import type { OtpProvider } from "../otp-provider.interface";

// Default/mock provider — used whenever OTP_PROVIDER is unset or no real vendor is configured.
// Mirrors the fallback pattern already used by lib/email.ts (log instead of failing the flow).
export class ConsoleOtpProvider implements OtpProvider {
  readonly name = "console";

  async sendOtp(phone: string, code: string): Promise<void> {
    console.warn(`[otp] No SMS provider configured — would have sent OTP ${code} to +91${phone}`);
  }
}
