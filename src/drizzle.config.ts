import 'dotenv/config'; // THIS NEED TO BE AT THE TOP !!!IMPORTANT
import type { Config } from 'drizzle-kit';

export default {
    driver: 'pg',
    out: './src/drizzle',
    schema: ['./src/sql/botSchema/*'],
    dbCredentials: {
        host: process.env.POSTGRES_HOST ?? '',
        port: Number(process.env.POSTGRES_PORT),
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB ?? '',
    },
    // Print all statements
    verbose: true,
    // Always ask for confirmation
    strict: true,
} satisfies Config;
