import type { OtpProvider } from "../otp-provider.interface";

// Real adapter for MSG91's OTP API (https://docs.msg91.com/otp). Only instantiated when
// OTP_PROVIDER=msg91 and OTP_API_KEY is set — see otp-provider.factory.ts.
export class Msg91OtpProvider implements OtpProvider {
  readonly name = "msg91";

  constructor(
    private readonly apiKey: string,
    private readonly senderId?: string
  ) {}

  async sendOtp(phone: string, code: string): Promise<void> {
    const res = await fetch("https://control.msg91.com/api/v5/otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: this.apiKey,
      },
      body: JSON.stringify({
        mobile: `91${phone}`,
        otp: code,
        sender: this.senderId,
        template_id: undefined, // set once an MSG91 DLT-approved template is provisioned
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`[otp] MSG91 send failed (${res.status}): ${body}`);
    }
  }
}
