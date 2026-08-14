import type { OtpProvider } from "../otp-provider.interface";

// Real adapter for Exotel's SMS API (https://developer.exotel.com/api/send-sms). Only
// instantiated when OTP_PROVIDER=exotel and the Exotel credentials are set — see
// otp-provider.factory.ts. Exotel auths via SID + token in the URL rather than a single API key,
// so this adapter takes both instead of the single `apiKey` the other two providers use.
export class ExotelOtpProvider implements OtpProvider {
  readonly name = "exotel";

  constructor(
    private readonly sid: string,
    private readonly token: string,
    private readonly senderId: string
  ) {}

  async sendOtp(phone: string, code: string): Promise<void> {
    const url = `https://${this.sid}:${this.token}@api.exotel.com/v1/Accounts/${this.sid}/Sms/send.json`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        From: this.senderId,
        To: `+91${phone}`,
        Body: `Your Hubigo business verification code is ${code}. It expires in a few minutes. Do not share this code.`,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`[otp] Exotel send failed (${res.status}): ${body}`);
    }
  }
}
