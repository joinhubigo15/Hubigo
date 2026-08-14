import { initSentry } from "./lib/sentry";
initSentry();

import app from "./app";
import { env, googleOAuthEnabled, emailEnabled } from "./config/env";

app.listen(env.PORT, () => {
  console.log(`Hubigo backend listening on http://localhost:${env.PORT}`);
  console.log(`  Google OAuth: ${googleOAuthEnabled ? "enabled" : "disabled (missing credentials)"}`);
  console.log(`  Email delivery: ${emailEnabled ? "enabled (Resend)" : "disabled (logging to console)"}`);
});
