import nodemailer from 'nodemailer';

export const mailServer = nodemailer.createTransport({
    // @ts-ignore
    host: process.env.MAIL_HOST || 'localhost',
    port: process.env.MAIL_PORT || 1025,
    secure: false,
    auth: {
        user: process.env.MAIL_USER || 'hello@hello.com',
        pass: process.env.MAIL_PASS || 'undefined',
    },
    tls: { rejectUnauthorized: false },
});
