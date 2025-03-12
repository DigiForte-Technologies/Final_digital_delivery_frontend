import dotenv from 'dotenv';
dotenv.config();

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import pkg from 'pg';
const { Pool } = pkg;
import fetch from 'node-fetch'; // or use any HTTP client

// Path to your SQLite database file
const DB_PATH = './database.sqlite';

// ---------- PostgreSQL Setup ----------
const pool = new Pool({
  connectionString:
    'postgresql://neondb_owner:npg_vFbpeX5cSQC2@ep-frosty-math-a8ot8nq6-pooler.eastus2.azure.neon.tech/neondb?sslmode=require',
});

pool
  .connect()
  .then((client) => {
    console.log('✅ PostgreSQL Connected Successfully!');
    client.release();
  })
  .catch((err) => {
    console.error('❌ Error connecting to PostgreSQL:', err);
    process.exit(1);
  });

async function syncSessions() {
  try {
    // Open SQLite database
    const db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database,
    });

    // Query the Shopify sessions from SQLite
    const rows = await db.all("SELECT shop, accessToken FROM shopify_sessions");
    console.log(`Found ${rows.length} sessions in SQLite.`);

    for (const row of rows) {
      try {
        // First check if the tenant exists in our Postgres tenants table
        const tenantRes = await pool.query(
          "SELECT id FROM tenants WHERE shopify_store_url = $1",
          [row.shop]
        );

        if (tenantRes.rows.length === 0) {
          // Tenant does not exist. Simulate a signup by POSTing to the /signup route.
          // Adjust the URL to match your deployed endpoint.
          const signupResponse = await fetch('https://shopify-digital-download.fly.dev/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // You might want to use defaults or generate dummy credentials.
            body: JSON.stringify({
              username: row.shop, // using the shop domain as username
              password: 'admin', // use a default/dummy password
              shopify_store_url: row.shop,
              shopify_api_password: row.accessToken
            }),
          });

          if (!signupResponse.ok) {
            console.error(`Signup failed for shop ${row.shop}`);
            continue; // skip to next session if signup fails
          }
          console.log(`Created new tenant for shop: ${row.shop}`);
        } else {
          // Tenant exists, so update its Shopify API password (token) in the DB.
          const updateQuery = `
            UPDATE tenants
            SET shopify_api_password = $1
            WHERE shopify_store_url = $2
          `;
          await pool.query(updateQuery, [row.accessToken, row.shop]);
          console.log(`Updated token for shop: ${row.shop}`);
        }
      } catch (pgErr) {
        console.error(`Error processing shop ${row.shop}:`, pgErr);
      }
    }

    console.log("Session sync complete.");
    process.exit(0);
  } catch (err) {
    console.error("Error syncing sessions:", err);
    process.exit(1);
  }
}

// Export the syncSessions function
export { syncSessions };

// Only run the function if this module is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  syncSessions().then(() => process.exit(0)).catch(() => process.exit(1));
}
