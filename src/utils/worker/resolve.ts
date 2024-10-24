import { createComment } from '../db/createComment';

import * as emailTemplates from './mail/templates';
import { sendMail } from './mail';
import { JobDataMap } from './create';
import { goalPingJob } from './goalPingJob';
import { externalTaskCheckJob, externalTasksJob } from './externalTasksJob';

export const email = async ({ template, data }: JobDataMap['email']) => {
    const renderedTemplate = await emailTemplates[template](data);
    return sendMail(renderedTemplate);
};

export const cron = async ({ template }: JobDataMap['cron']) => {
    switch (template) {
        case 'externalTaskCheck':
            externalTaskCheckJob();
            break;
        case 'goalPing':
            goalPingJob();
            break;
        default:
            throw new Error('No supported cron jobs');
    }
};

export const comment = async ({ activityId, description, goalId }: JobDataMap['comment']) => {
    await createComment({
        description,
        activityId,
        goalId,
        role: 'USER',
        shouldUpdateGoal: false,
    });
};

export const criteriaToUpdate = async ({ id }: JobDataMap['criteriaToUpdate']) => {
    await externalTasksJob(id);
};
