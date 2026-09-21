import crypto from "crypto";
import express from "express";
import Stripe from "stripe";
import { resolveSiteContent } from "./siteContent";
import {
  verifyAdminPassword,
  createSessionToken,
  verifySessionToken,
  parseCookies,
  buildSessionCookie,
  buildClearSessionCookie,
  SESSION_COOKIE_NAME,
} from "./adminAuth";
import * as db from "./db";

let stripeClient: Stripe | null = null;
const getStripe = () => {
  if (!stripeClient && process.env.STRIPE_SECRET_KEY) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia" as any,
    });
  }
  return stripeClient;
};

/**
 * All /api/* route handlers, shared between the local dev server
 * (server.ts, mounted at /api) and the Netlify Function that serves
 * the same paths in production (netlify/functions/api.ts).
 */
export function createApiRouter(): express.Router {
  const router = express.Router();

  const requireAdmin: express.RequestHandler = (req, res, next) => {
    const cookies = parseCookies(req.headers.cookie);
    if (verifySessionToken(cookies[SESSION_COOKIE_NAME])) {
      return next();
    }
    res.status(401).json({ error: "需要管理員登入" });
  };

  // --- Admin auth ---

  router.post("/admin/login", (req, res) => {
    try {
      const { password } = req.body || {};
      if (typeof password !== "string" || !verifyAdminPassword(password)) {
        return res.status(401).json({ error: "密碼錯誤" });
      }
      const token = createSessionToken();
      res.setHeader("Set-Cookie", buildSessionCookie(token, process.env.NODE_ENV === "production"));
      res.json({ success: true });
    } catch (err: any) {
      console.error("Admin login error:", err);
      res.status(500).json({ error: err?.message || "登入時發生錯誤" });
    }
  });

  router.post("/admin/logout", (req, res) => {
    res.setHeader("Set-Cookie", buildClearSessionCookie(process.env.NODE_ENV === "production"));
    res.json({ success: true });
  });

  router.get("/admin/session", (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    res.json({ authenticated: verifySessionToken(cookies[SESSION_COOKIE_NAME]) });
  });

  // --- Editable site content (logo, nav, home/footer text, ...) ---

  router.get("/site-content", async (req, res) => {
    res.json(await db.getSiteContent());
  });

  router.post("/site-content", requireAdmin, async (req, res) => {
    try {
      // Re-validate server-side: drops unknown keys, caps lengths, sanitizes links.
      const content = resolveSiteContent(req.body);
      await db.saveSiteContent(content);
      res.json({ success: true, content });
    } catch (err: any) {
      console.error("Site content save error:", err);
      res.status(500).json({ error: err?.message || "儲存網站內容失敗" });
    }
  });

  // --- Image upload (admin only) ---

  const IMAGE_TYPES: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
  };
  const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

  router.post(
    "/admin/upload",
    requireAdmin,
    express.raw({ type: "image/*", limit: "5mb" }),
    async (req, res) => {
      try {
        const contentType = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
        const ext = IMAGE_TYPES[contentType];
        if (!ext) {
          return res.status(415).json({ error: "只支援 PNG、JPG、WebP、GIF、SVG 圖片" });
        }
        const body = req.body;
        if (!Buffer.isBuffer(body) || body.length === 0) {
          return res.status(400).json({ error: "沒有收到圖片檔案" });
        }
        if (body.length > MAX_UPLOAD_BYTES) {
          return res.status(413).json({ error: "圖片太大，請壓縮到 4MB 以內" });
        }
        const path = `uploads/${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
        const url = await db.uploadSiteAsset(body, contentType, path);
        res.json({ success: true, url });
      } catch (err: any) {
        console.error("Upload error:", err);
        res.status(500).json({ error: err?.message || "上傳失敗" });
      }
    }
  );

  // --- Config ---

  router.get("/config", async (req, res) => {
    try {
      res.json(await db.getConfig());
    } catch (err: any) {
      console.error("Load config error:", err);
      res.status(500).json({ error: err?.message || "Failed to load config" });
    }
  });

  router.post("/config", requireAdmin, async (req, res) => {
    try {
      const { homeBanners, physicalBanner, onlineBanner } = req.body || {};
      const config = await db.saveConfig({ homeBanners, physicalBanner, onlineBanner });
      res.json({ success: true, config });
    } catch (err: any) {
      console.error("Config save error:", err);
      res.status(500).json({ error: err?.message || "Failed to save configuration" });
    }
  });

  // --- Courses ---

  router.get("/courses", async (req, res) => {
    try {
      const { type } = req.query;
      res.json(await db.listCourses(typeof type === "string" ? type : undefined));
    } catch (err: any) {
      console.error("Load courses error:", err);
      res.status(500).json({ error: err?.message || "Failed to load courses" });
    }
  });

  router.get("/courses/:id", async (req, res) => {
    try {
      const course = await db.getCourse(req.params.id);
      if (course) {
        res.json(course);
      } else {
        res.status(404).json({ error: "Course not found" });
      }
    } catch (err: any) {
      console.error("Load course error:", err);
      res.status(500).json({ error: err?.message || "Failed to load course" });
    }
  });

  router.post("/courses", requireAdmin, async (req, res) => {
    try {
      const { title, type, category, price, description, image, tags, location, duration, details, startDate, endDate } = req.body || {};
      const course = await db.createCourse({
        type: type === "online" ? "online" : "physical",
        title: title || "",
        category: category || "",
        price: Number(price) || 0,
        description: description || "",
        image: image || "",
        tags: Array.isArray(tags) ? tags : (tags ? String(tags).split(",").map((t: string) => t.trim()).filter(Boolean) : []),
        location: location || "",
        duration: duration || "",
        details: details || "",
        startDate: startDate || "",
        endDate: endDate || "",
      });
      res.json({ success: true, course });
    } catch (err: any) {
      console.error("Course create error:", err);
      res.status(500).json({ error: err?.message || "Failed to create course" });
    }
  });

  router.put("/courses/:id", requireAdmin, async (req, res) => {
    try {
      const { title, type, category, price, description, image, tags, location, duration, details, startDate, endDate } = req.body || {};
      const patch: any = {};
      if (title !== undefined) patch.title = title;
      if (type !== undefined) patch.type = type;
      if (category !== undefined) patch.category = category;
      if (price !== undefined) patch.price = Number(price) || 0;
      if (description !== undefined) patch.description = description;
      if (image !== undefined) patch.image = image;
      if (tags !== undefined) patch.tags = Array.isArray(tags) ? tags : String(tags).split(",").map((t: string) => t.trim()).filter(Boolean);
      if (location !== undefined) patch.location = location;
      if (duration !== undefined) patch.duration = duration;
      if (details !== undefined) patch.details = details;
      if (startDate !== undefined) patch.startDate = startDate;
      if (endDate !== undefined) patch.endDate = endDate;

      const course = await db.updateCourse(req.params.id, patch);
      if (course) {
        res.json({ success: true, course });
      } else {
        res.status(404).json({ error: "Course not found" });
      }
    } catch (err: any) {
      console.error("Course update error:", err);
      res.status(500).json({ error: err?.message || "Failed to update course" });
    }
  });

  router.delete("/courses/:id", requireAdmin, async (req, res) => {
    try {
      const removed = await db.deleteCourse(req.params.id);
      if (removed) {
        res.json({ success: true, course: removed });
      } else {
        res.status(404).json({ error: "Course not found" });
      }
    } catch (err: any) {
      console.error("Course delete error:", err);
      res.status(500).json({ error: err?.message || "Failed to delete course" });
    }
  });

  // --- Stripe checkout ---

  router.post("/create-checkout-session", async (req, res) => {
    try {
      const { courseId } = req.body || {};
      const course = await db.getCourse(courseId);

      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      const stripe = getStripe();
      const origin = req.headers.origin || "http://localhost:3000";

      if (!stripe) {
        return res.json({
          url: `${origin}/success?session_id=demo_session_${course.id}&course_id=${course.id}`,
        });
      }

      const isSubscription = course.type === "online";

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "twd",
              product_data: {
                name: course.title,
                description: course.description,
                images: course.image.startsWith("http") ? [course.image] : [],
              },
              unit_amount: course.price * 100,
              ...(isSubscription && {
                recurring: {
                  interval: "month",
                },
              }),
            },
            quantity: 1,
          },
        ],
        mode: isSubscription ? "subscription" : "payment",
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}&course_id=${course.id}`,
        cancel_url: `${origin}/${course.type === "physical" ? "physical-courses" : "online-courses"}`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe Checkout Error:", error);
      res.status(500).json({ error: error.message || "Failed to create checkout session" });
    }
  });

  router.get("/checkout-session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const stripe = getStripe();

      if (!stripe || sessionId.startsWith("demo_session_")) {
        return res.json({
          id: sessionId,
          payment_status: "paid",
          status: "complete",
          demo: true,
        });
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      res.json(session);
    } catch (error: any) {
      console.error("Retrieve Session Error:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve session" });
    }
  });

  return router;
}
