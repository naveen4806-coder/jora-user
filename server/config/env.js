import 'dotenv/config';

const required = ['MONGODB_URI'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`${key} is required in server/.env.`);
}

export const env = Object.freeze({
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI,
  // JWT_SECRET is accepted only as a local migration fallback. Production must
  // provide two separate secrets as documented in .env.example.
  accessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || '',
  refreshSecret: process.env.JWT_REFRESH_SECRET || `${process.env.JWT_SECRET || ''}:refresh`,
  clientOrigins: (process.env.CLIENT_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',').map(value => value.trim()).filter(Boolean),
  adminEmail: String(process.env.ADMIN_EMAIL || 'joraofficial@gmail.com').toLowerCase(),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || ''
  }
});

if (!env.accessSecret) throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required in server/.env.');
