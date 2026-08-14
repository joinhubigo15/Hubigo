import type { OtpProvider } from "../otp-provider.interface";

// Real adapter for 2Factor's Custom SMS OTP API (https://2factor.in/EmailApiDoc/#/SMS-OTP).
// Only instantiated when OTP_PROVIDER=2factor and OTP_API_KEY is set — see otp-provider.factory.ts.
export class TwoFactorOtpProvider implements OtpProvider {
  readonly name = "2factor";

  constructor(private readonly apiKey: string) {}

  async sendOtp(phone: string, code: string): Promise<void> {
    const url = `https://2factor.in/API/V1/${this.apiKey}/SMS/91${phone}/${code}`;
    const res = await fetch(url);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`[otp] 2Factor send failed (${res.status}): ${body}`);
    }

    const json = (await res.json().catch(() => null)) as { Status?: string } | null;
    if (json?.Status !== "Success") {
      throw new Error(`[otp] 2Factor send failed: ${JSON.stringify(json)}`);
    }
  }
}
