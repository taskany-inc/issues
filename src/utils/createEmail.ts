import * as Sentry from '@sentry/nextjs';

import { createEmailJob } from './worker/create';

export const createEmail = (...parameters: Parameters<typeof createEmailJob>) => {
    const [template, { authorEmail, to, ...rest }] = parameters;

    if (!to.length) {
        Sentry.captureException(new Error('No recipients defined'), {
            extra: {
                template,
                authorEmail,
                to,
                ...rest,
            },
        });
        return;
    }

    const updatedData = {
        authorEmail,
        to: to.filter((email) => email !== authorEmail),
        ...rest,
    };

    if (!updatedData.to.length) {
        return;
    }

    return createEmailJob(template, updatedData);
};
