/**
 * One-time (or per-new-admin) setup: creates/updates an AdminUser row for the real internal
 * admin console at /admin. Run manually — there is no self-registration for admin accounts.
 *
 * Usage (from backend/):
 *   npx tsx scripts/bootstrap-admin.ts --email=you@hubigo.in --password="a-strong-password" --name="Your Name"
 *   npx tsx scripts/bootstrap-admin.ts --email=you@hubigo.in --password="..." --name="..." --role=admin
 *
 * Prints an otpauth:// URI (paste into an authenticator app, or convert to a QR code) for the
 * shared ADMIN_2FA_SECRET from .env — every admin scans the SAME secret, since this is a small
 * internal team, not a per-admin-provisioned secret.
 */
import { prisma } from "../src/lib/prisma";
import { hashAdminPassword } from "../src/services/admin-auth.service";
import { env, adminAllowedEmails } from "../src/config/env";
import { generateBase32Secret } from "../src/lib/totp";

function parseArgs(): { email: string; password: string; name: string; role: string } {
  const raw = process.argv.slice(2);
  const get = (key: string) => raw.find((a) => a.startsWith(`--${key}=`))?.split("=").slice(1).join("=");

  const email = get("email")?.trim().toLowerCase();
  const password = get("password");
  const name = get("name");
  const role = get("role") ?? "super_admin";

  if (!email || !password || !name) {
    throw new Error('Usage: npx tsx scripts/bootstrap-admin.ts --email=you@hubigo.in --password="..." --name="Your Name" [--role=admin]');
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  return { email, password, name, role };
}

async function main() {
  const { email, password, name, role: roleSlug } = parseArgs();

  if (!env.ADMIN_2FA_SECRET) {
    const generated = generateBase32Secret();
    console.log("\nADMIN_2FA_SECRET is not set in .env yet. Generated one for you — add this line to backend/.env:");
    console.log(`ADMIN_2FA_SECRET=${generated}\n`);
    console.log("Then re-run this script so the otpauth:// URI below uses the real secret.");
    await prisma.$disconnect();
    return;
  }

  if (!env.ADMIN_JWT_SECRET) {
    console.log("\nADMIN_JWT_SECRET is not set in .env yet. Add this line to backend/.env (and the identical value to the frontend's .env.local):");
    console.log(`ADMIN_JWT_SECRET=${require("node:crypto").randomBytes(48).toString("hex")}\n`);
  }

  if (!adminAllowedEmails.has(email)) {
    console.warn(
      `WARNING: "${email}" is not in ADMIN_ALLOWED_EMAILS — this account will be created but cannot log in until you add it to backend/.env.`,
    );
  }

  const role = await prisma.adminRole.upsert({
    where: { slug: roleSlug },
    update: {},
    create: {
      slug: roleSlug,
      name: roleSlug === "super_admin" ? "Super Admin" : roleSlug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      permissions: roleSlug === "super_admin" ? ["*"] : [],
    },
  });

  const passwordHash = await hashAdminPassword(password);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, name, roleId: role.id, status: "ACTIVE", isTwoFactorEnabled: true },
    create: { email, name, passwordHash, roleId: role.id, status: "ACTIVE", isTwoFactorEnabled: true },
  });

  console.log(`\nAdmin account ready: ${admin.email} (role: ${role.name})`);

  const otpauthUri = `otpauth://totp/Hubigo%20Admin:${encodeURIComponent(email)}?secret=${env.ADMIN_2FA_SECRET}&issuer=Hubigo&algorithm=SHA1&digits=6&period=30`;
  console.log("\nScan this into your authenticator app (Google Authenticator, Authy, 1Password, etc.):");
  console.log(otpauthUri);
  console.log(`\nOr enter the secret manually: ${env.ADMIN_2FA_SECRET}`);
  console.log("\nAll admins share this same 2FA secret — every authenticator app will show the same 6-digit code at any given moment.");

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err.message ?? err);
  await prisma.$disconnect();
  process.exit(1);
});
