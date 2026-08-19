import path from "path";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import passport from "./lib/passport";
import { env, isProd } from "./config/env";
import authRoutes from "./routes/auth.routes";
import usersRoutes from "./routes/users.routes";
import searchRoutes from "./routes/search.routes";
import nearbyRoutes from "./routes/nearby.routes";
import businessesRoutes from "./routes/businesses.routes";
import claimsRoutes from "./routes/claims.routes";
import adminRoutes from "./routes/admin.routes";
import adminAuthRoutes from "./routes/admin-auth.routes";
import businessDashboardRoutes from "./routes/business-dashboard.routes";
import contactRoutes from "./routes/contact.routes";
import { categoriesRouter, citiesRouter, amenitiesRouter, statsRouter, offersRouter, popularRouter } from "./routes/taxonomy.routes";
import { pseoRouter } from "./routes/pseo.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
// import { blockScrapers } from "./middleware/blockScrapers"; // disabled — see note below

const app = express();

// Railway sits in front of this server as a single reverse-proxy hop — without this, req.ip
// resolves to Railway's own address for every request, which silently breaks rate-limiting
// (all traffic looks like one IP) and makes admin audit log IP addresses meaningless. `1` trusts
// exactly one hop (the proxy immediately in front), not an arbitrary chain.
app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(morgan(isProd ? "combined" : "dev"));

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "ok", data: { status: "healthy" } });
});

// Disabled (2026-08-19) — req.ip is unreliable on this infra under trust proxy: 1: /debug/ip
// showed Express resolving a real visitor's request to one of the blocked scraper IPs instead of
// their own (XFF: "<real client>, <scraper ip>" but reqIp came back as the scraper ip), so this
// was blocking real traffic, not just the scraper. Needs a reliable client-IP source (a Railway-
// specific header, or a real edge like Cloudflare) before re-enabling. See blockScrapers.ts.
// app.use(blockScrapers);

app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "public", "uploads"), {
    setHeaders: (res) => res.setHeader("Cross-Origin-Resource-Policy", "cross-origin"),
  })
);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/nearby", nearbyRoutes);
// claimsRoutes is mounted before businessesRoutes so its multi-segment paths
// (e.g. "/:businessId/claim/otp/send") are matched before businessesRoutes' bare "/:slug".
app.use("/api/v1/businesses", claimsRoutes);
app.use("/api/v1/businesses/me", businessDashboardRoutes);
app.use("/api/v1/businesses", businessesRoutes);
app.use("/api/v1/categories", categoriesRouter);
app.use("/api/v1/cities", citiesRouter);
app.use("/api/v1/amenities", amenitiesRouter);
app.use("/api/v1/stats", statsRouter);
app.use("/api/v1/offers", offersRouter);
app.use("/api/v1/popular", popularRouter);
app.use("/api/v1/pseo", pseoRouter);
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/admin/auth", adminAuthRoutes);
app.use("/api/v1/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
