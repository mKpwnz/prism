import 'dotenv/config'; // THIS NEED TO BE AT THE TOP !!!IMPORTANT
import type { Config } from 'drizzle-kit';

export default {
    dialect: 'postgresql',
    out: './src/drizzle',
    schema: ['./src/sql/botSchema/*'],
    // Print all statements
    verbose: true,
    // Always ask for confirmation
    strict: true,
} satisfies Config;
