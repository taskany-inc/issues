/* eslint-disable no-underscore-dangle */
import nextConnect from 'next-connect';
import type { NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '../../utils/auth';

const route = nextConnect({
    onError(error: Error, _, res: NextApiResponse) {
        res.status(500).json({ error: `Something went wrong: ${error.message}` });
    },
    onNoMatch: (_, res: NextApiResponse) => {
        res.status(400).json({ error: 'We are sorry, but it is impossible' });
    },
});

route.post(async (req: any, res: NextApiResponse) => {
    if (!process.env.FEEDBACK_URL) {
        return res.status(401).json({ error: 'Feedback url is not set' });
    }

    const { body: parsedBody } = req;
    parsedBody.userAgent = req.headers['user-agent'];
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user) {
        return res.status(403).json({ error: 'User is not authorized' });
    }

    const { name, email, image } = session.user;
    parsedBody.name = name;
    parsedBody.email = email;
    parsedBody.avatarUrl = image;

    const feedbackResponse = await fetch(process.env.FEEDBACK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedBody),
    });

    return res.status(feedbackResponse.status).send(feedbackResponse.body);
});

export default route;
