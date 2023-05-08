import { sendMail } from '../mail';
import * as emailTemplates from '../mail/templates';

import { JobDataMap } from './create';

export const email = ({ template, data }: JobDataMap['email']) => sendMail(emailTemplates[template](data));
