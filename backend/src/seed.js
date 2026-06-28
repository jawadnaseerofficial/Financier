import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pool from './db/connection.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function seed() {
  const client = await pool.connect()

  try {
    console.log('Dropping existing tables...')
    await client.query(`
      DROP TABLE IF EXISTS transactions CASCADE;
      DROP TABLE IF EXISTS recurring CASCADE;
      DROP TABLE IF EXISTS budgets CASCADE;
      DROP TABLE IF EXISTS goals CASCADE;
      DROP TABLE IF EXISTS investments CASCADE;
      DROP TABLE IF EXISTS accounts CASCADE;
    `)

    console.log('Running schema...')
    const schema = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8')
    await client.query(schema)

    console.log('Seeding data...')
    const seed = fs.readFileSync(path.join(__dirname, 'db', 'seed.sql'), 'utf8')
    await client.query(seed)

    console.log('Database seeded successfully!')
  } catch (err) {
    console.error('Error seeding database:', err)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

seed()
