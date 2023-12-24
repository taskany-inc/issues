import * as emailTemplates from './mail/templates';
import { sendMail } from './mail';
import { JobDataMap } from './create';
import { goalPingJob } from './goalPingJob';

export const email = async ({ template, data }: JobDataMap['email']) => {
    const renderedTemplate = await emailTemplates[template](data);
    return sendMail(renderedTemplate);
};

export const cron = async ({ template }: JobDataMap['cron']) => {
    if (template === 'goalPing') {
        goalPingJob();
    } else {
        throw new Error('No supported cron jobs');
    }
};
