const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    host: process.env.DB_HOST || 'postgres-db',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'cloud_db',
    port: 5432,
});

const s3 = new S3Client({
    region: 'us-east-1',
    endpoint: process.env.S3_PUBLIC_ENDPOINT || 'http://s3.meicm.pt',
    forcePathStyle: true,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin'
    }
});

const BUCKET_NAME = 'profile-pictures';

var retries = process.env.DATABASE_CONNECTION_RETRIES || 5;

const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) NOT NULL,
                picture_filename VARCHAR(255) NOT NULL
            );
        `);
        console.log("PostgreSQL Table 'users' initialized.");
    } catch (err) {
        console.error("DB Init Error:", err);
        retries--;
        if (retries <= 0) {
            process.exit(1);
        }
        
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 5000);
        });
        initDB();
    }
};
initDB();

app.get('/upload-url', async (req, res) => {
    try {
        const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.jpg';
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: filename,
            ContentType: 'image/jpeg'
        });
        
        const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour expiration
        
        res.json({ uploadUrl, filename });
    } catch (err) {
        console.error("S3 Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/users', async (req, res) => {
    const { username, picture_filename } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO users (username, picture_filename) VALUES ($1, $2) RETURNING *',
            [username, picture_filename]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error("PG Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("API Gateway backend running on port " + PORT);
});