// Provider abstraction for sending an OTP SMS. Business logic (otp.service.ts) only ever talks
// to this interface — swapping MSG91 for 2Factor or Exotel means adding a new class here and
// pointing OTP_PROVIDER at it in .env, nothing else in the codebase changes.
export interface OtpProvider {
  /** Human-readable name, surfaced in logs/error messages. */
  readonly name: string;

  /** Send a numeric OTP code to an Indian mobile number (10 digits, no country code). */
  sendOtp(phone: string, code: string): Promise<void>;
}
