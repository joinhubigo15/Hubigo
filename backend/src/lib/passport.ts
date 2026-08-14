import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env, googleOAuthEnabled } from "../config/env";
import { findOrCreateGoogleUser } from "../services/auth.service";

if (googleOAuthEnabled) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID!,
        clientSecret: env.GOOGLE_CLIENT_SECRET!,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        scope: ["profile", "email"],
        passReqToCallback: true,
      },
      async (req, _accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("Google account has no accessible email address"));
          }

          let role: "user" | "business_owner" = "user";
          try {
            if (req.query.state) {
              const stateObj = JSON.parse(req.query.state as string);
              if (stateObj.role === "business_owner") {
                role = "business_owner";
              }
            }
          } catch (e) {
            // Ignore JSON parse errors if state is plain string
            if (req.query.state === "business_owner") {
              role = "business_owner";
            }
          }

          const user = await findOrCreateGoogleUser({
            googleId: profile.id,
            email: email.toLowerCase(),
            name: profile.displayName || "Hubigo User",
            role,
          });

          done(null, user);
        } catch (err) {
          // A suspended/deleted account is an expected, user-facing outcome — not a server error —
          // so it goes through passport's "authentication failure" path (done(null, false, info))
          // instead of done(err). done(err) skips failureRedirect entirely and lands in Express's
          // generic error handler, which is why suspended users used to see a raw JSON blob instead
          // of a proper page (see auth.routes.ts's google/callback for how `info` becomes a redirect).
          if (err instanceof Error && err.message.includes("suspended")) {
            return done(null, false, { message: "account_suspended" });
          }
          done(err as Error);
        }
      }
    )
  );
}

export default passport;
