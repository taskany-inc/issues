import { mailServer } from './server';

export interface SendMailProps {
    to: Array<string | undefined>;
    subject: string;
    text: string;
    html: string;
}

export const sendMail = ({ to, subject, text, html }: SendMailProps) =>
    mailServer.sendMail({
        from: `"Taskany Issues" <${process.env.MAIL_USER}>`,
        to: to.join(', '),
        subject,
        text,
        html,
    });
