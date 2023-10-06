import { createPool } from 'mysql2/promise'

export const Database = createPool({
    host: process.env.SQL_HOST,
    database: process.env.SQL_DATABASE,
    password: process.env.SQL_PASS,
    user: process.env.SQL_USER,
    port: parseInt(process.env.SQL_PORT ?? '3306'),
})
