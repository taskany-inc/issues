import { mailServer } from './server';

export interface SendMailProps {
    to: Array<string>;
    subject: string;
    text: string;
    html: string;
}

// TODO: https://github.com/taskany-inc/issues/issues/2330
// import { render } from '@react-email/render';
// const emailHtml = render(<Email url="https://example.com" />);
export const sendMail = ({ to, subject, text, html }: SendMailProps) => {
    if (process.env.MAIL_USER && process.env.MAIL_PASS) {
        return mailServer.sendMail({
            from: `"Taskany Issues" <${process.env.MAIL_USER}>`,
            to: to.join(', '),
            subject,
            text,
            html,
        });
    }
};
