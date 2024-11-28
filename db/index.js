import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

const baseDir = process.cwd();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT, // default Postgres port
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [path.join(baseDir, 'db', 'models', '*.js')],
    synchronize: true,
    logging: false, // Set to false in production
});

AppDataSource.initialize()
    .then(() => {
        console.log('Data Source has been initialized!');
    })
    .catch((error) => {
        console.error('Error during Data Source initialization', error);
    });
