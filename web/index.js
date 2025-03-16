// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";

import { syncSessions } from "./sync-sessions.js";

import jwt from 'jsonwebtoken';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import crypto from "crypto";
import pkg from "pg";
const { Pool } = pkg;

// Path to your SQLite database file
const DB_PATH = './database.sqlite';

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  async (req, res, next) => {
    // Call the syncSessions function after successful auth
    try {
      await syncSessions();
    } catch (err) {
      console.error("Error syncing sessions after auth:", err);
      // Optionally handle error (but don't block the auth flow)
    }
    shopify.redirectToShopifyOrAppRoot()(req, res, next);
  }
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());

app.get("/api/products/count", async (_req, res) => {
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  const countData = await client.request(`
    query shopifyProductCount {
      productsCount {
        count
      }
    }
  `);

  res.status(200).send({ count: countData.data.productsCount.count });
});

app.post("/api/products", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});

const pool = new Pool({
  connectionString:
    "postgresql://neondb_owner:npg_vFbpeX5cSQC2@ep-frosty-math-a8ot8nq6-pooler.eastus2.azure.neon.tech/neondb?sslmode=require",
});

// Ensure table exists
async function createTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS webhook_signatures (
        id SERIAL PRIMARY KEY,
        shop_url TEXT UNIQUE NOT NULL,
        webhook_secret TEXT NOT NULL
      );
    `);
    console.log("✅ Webhook Signatures Table Ready!");
  } finally {
    client.release();
  }
}
createTable();

app.use(express.json());

// ✅ Register Webhook & Store Signature in DB
app.get("/api/register-webhook", async (req, res) => {
  try {
    const shop = "16255281.myshopify.com"; // Replace with dynamic shop detection
    const session = await shopify.config.sessionStorage.findSessionsByShop(shop);
    if (!session || session.length === 0) {
      return res.status(401).json({ error: "No active session found" });
    }

    const client = new shopify.api.clients.Rest({
      session: session[0],
    });

    // Generate a unique webhook secret
    const webhookSecret = crypto.randomBytes(32).toString("hex");

    const response = await client.post({
      path: "webhooks",
      data: {
        webhook: {
          topic: "orders/create",
          address: "https://f77c-2600-3c04-00-f03c-95ff-fecc-2c37.ngrok-free.app/webhook",
          format: "json",
        },
      },
    });

    // Store webhook secret and shop URL in PostgreSQL
    await pool.query(
      "INSERT INTO webhook_signatures (shop_url, webhook_secret) VALUES ($1, $2) ON CONFLICT (shop_url) DO UPDATE SET webhook_secret = $2",
      [shop, webhookSecret]
    );

    console.log("✅ Webhook Registered:", response.body);
    res.status(200).json({ success: true, message: "Webhook registered successfully" });
  } catch (error) {
    console.error("❌ Error registering webhook:", error);
    res.status(500).json({ error: "Failed to register webhook" });
  }
});

// ✅ Properly Initialize Database Connection
let db;
async function initDB() {
  db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });
}
await initDB(); // ✅ Call async function at startup

// ✅ New route to return SSO token as JSON
app.get('/api/sso-token', async (req, res) => {
  try {
    // Query the database asynchronously to fetch the shop dynamically
    const tenant = await db.get("SELECT shop FROM shopify_sessions LIMIT 1");

    if (!tenant || !tenant.shop) {
      return res.status(404).json({ error: "No Shopify store found in database" });
    }

    const shop = tenant.shop; // Get the store URL from database

    // Generate a short-lived JWT token with the shop URL
    const token = jwt.sign(
      { shop },
      process.env.SSO_SECRET || "yourSuperSecretKeyForSSO",
      { expiresIn: '5m' }
    );

    res.json({ token, shop });
  } catch (error) {
    console.error("Error fetching shop from database:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
    );
});

app.listen(PORT);
