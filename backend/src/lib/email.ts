import { Resend } from "resend";
import { env, emailEnabled } from "../config/env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    // No RESEND_API_KEY configured yet — log instead of failing registration/reset flows outright.
    console.warn(`[email] RESEND_API_KEY not set — would have sent "${subject}" to ${to}`);
    console.warn(html);
    return;
  }

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  });

  if (error) {
    console.error("[email] Resend send failed:", error);
    throw new Error("Failed to send email");
  }
}

export function sendVerificationEmail(to: string, name: string, verifyUrl: string) {
  return send(
    to,
    "Verify your Hubigo account",
    `<div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#0F172A;">Hi ${name},</h2>
      <p style="color:#334155;">Welcome to Hubigo — please confirm your email address to activate your account.</p>
      <p style="margin: 24px 0;">
        <a href="${verifyUrl}" style="background:#F43F5E;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Verify Email</a>
      </p>
      <p style="color:#94A3B8;font-size:12px;">This link expires in 24 hours. If you didn't create a Hubigo account, you can ignore this email.</p>
    </div>`
  );
}

export function sendAccountSuspendedEmail(to: string, name: string) {
  return send(
    to,
    "Your Hubigo account has been suspended",
    `<div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#0F172A;">Hi ${name},</h2>
      <p style="color:#334155;">Your Hubigo account has been suspended and you will no longer be able to sign in. If you believe this is a mistake, please contact our support team and we'll help sort it out.</p>
      <p style="color:#334155;">Email: <a href="mailto:joinhubigo@gmail.com">joinhubigo@gmail.com</a><br/>Phone: +91 86184 06401</p>
    </div>`
  );
}

export { emailEnabled };
