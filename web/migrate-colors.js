require('dotenv').config({ path: './.env.local' });
const { sql } = require('@vercel/postgres');

async function run() {
  try {
    await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS color TEXT`;
    console.log("Column 'color' added successfully.");
  } catch (err) {
    console.error("Error running migration:", err);
  }
}
run();
