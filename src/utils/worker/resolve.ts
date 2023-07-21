import * as emailTemplates from './mail/templates';
import { sendMail } from './mail';
import { JobDataMap } from './create';

export const email = async ({ template, data }: JobDataMap['email']) => {
    const renderedTemplate = await emailTemplates[template](data);
    return sendMail(renderedTemplate);
};
