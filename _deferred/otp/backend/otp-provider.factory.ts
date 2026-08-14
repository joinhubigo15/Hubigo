import { env } from "../../config/env";
import type { OtpProvider } from "./otp-provider.interface";
import { ConsoleOtpProvider } from "./providers/console-otp.provider";
import { Msg91OtpProvider } from "./providers/msg91-otp.provider";
import { TwoFactorOtpProvider } from "./providers/two-factor-otp.provider";
import { ExotelOtpProvider } from "./providers/exotel-otp.provider";

let cached: OtpProvider | null = null;

// The single place that knows which concrete OTP vendor is active. Everything else in the
// codebase (otp.service.ts, and anything that calls it) depends only on the OtpProvider
// interface, so adding a new vendor means adding one class + one case here — no other file
// changes. Falls back to the console/mock provider whenever the selected vendor's credentials
// aren't configured yet, so local dev and staging never need real SMS credentials.
export function getOtpProvider(): OtpProvider {
  if (cached) return cached;

  switch (env.OTP_PROVIDER) {
    case "msg91":
      if (env.OTP_API_KEY) {
        cached = new Msg91OtpProvider(env.OTP_API_KEY, env.OTP_SENDER_ID);
        break;
      }
      console.warn("[otp] OTP_PROVIDER=msg91 but OTP_API_KEY is not set — falling back to console provider");
      cached = new ConsoleOtpProvider();
      break;

    case "2factor":
      if (env.OTP_API_KEY) {
        cached = new TwoFactorOtpProvider(env.OTP_API_KEY);
        break;
      }
      console.warn("[otp] OTP_PROVIDER=2factor but OTP_API_KEY is not set — falling back to console provider");
      cached = new ConsoleOtpProvider();
      break;

    case "exotel":
      if (env.EXOTEL_SID && env.EXOTEL_TOKEN && env.OTP_SENDER_ID) {
        cached = new ExotelOtpProvider(env.EXOTEL_SID, env.EXOTEL_TOKEN, env.OTP_SENDER_ID);
        break;
      }
      console.warn("[otp] OTP_PROVIDER=exotel but EXOTEL_SID/EXOTEL_TOKEN/OTP_SENDER_ID are not fully set — falling back to console provider");
      cached = new ConsoleOtpProvider();
      break;

    default:
      cached = new ConsoleOtpProvider();
  }

  return cached;
}

// Test/DI hook — lets otp.service.spec swap in a fake provider without touching env vars.
export function resetOtpProviderCache(): void {
  cached = null;
}
