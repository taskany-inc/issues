import { defineConfig } from 'cypress';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
    env: {
        ADMIN_EMAIL: process.env.ADMIN_EMAIL,
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    },
    e2e: {
        baseUrl: 'http://localhost:3000',
        supportFile: false,
    },
    video: false,
    viewportWidth: 1280,
    viewportHeight: 640,
});
