import { defineConfig } from 'cypress';
import * as dotenv from 'dotenv';

import { initDb } from './cypress/plugins';

dotenv.config();

export default defineConfig({
    env: {
        ADMIN_EMAIL: process.env.ADMIN_EMAIL,
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
        defaultPriority: 'Medium',
        currentUser: {
            user: {
                email: process.env.ADMIN_EMAIL,
            },
        },
    },
    e2e: {
        baseUrl: 'http://localhost:3000',
        supportFile: false,
        setupNodeEvents(on) {
            initDb(on);
        },
    },
    video: false,
});
