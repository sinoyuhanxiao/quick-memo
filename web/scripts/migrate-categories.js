require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function migrate() {
    try {
        console.log('Creating categories table...');
        await sql`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name TEXT UNIQUE NOT NULL
            )
        `;
        
        console.log('Fetching distinct categories from memos...');
        const { rows } = await sql`SELECT DISTINCT category FROM memos WHERE category IS NOT NULL AND category != 'Uncategorized'`;
        
        console.log(`Found ${rows.length} existing categories.`);
        for (const row of rows) {
            try {
                await sql`INSERT INTO categories (name) VALUES (${row.category}) ON CONFLICT DO NOTHING`;
                console.log(`Inserted category: ${row.category}`);
            } catch (e) {
                console.error(`Error inserting ${row.category}:`, e);
            }
        }
        
        console.log('Migration complete!');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
