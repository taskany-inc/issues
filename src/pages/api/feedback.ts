/* eslint-disable no-underscore-dangle */
import nextConnect from 'next-connect';
import type { NextApiResponse } from 'next';
import Cors from 'cors';
import { getSession } from 'next-auth/react';

export const config = {
    api: {
        bodyParser: false,
    },
};

const cors = Cors({
    origin: false,
    methods: ['HEAD', 'OPTIONS', 'POST'],
});

const route = nextConnect({
    onError(error: Error, _, res: NextApiResponse) {
        res.status(500).json({ error: `Something went wrong: ${error.message}` });
    },
    onNoMatch: (_, res: NextApiResponse) => {
        res.status(400).json({ error: 'We are sorry, but it is impossible' });
    },
}).use(cors);

route.post(async (req: any, res: NextApiResponse) => {
    const body = await new Promise<string>((resolve, reject) => {
        let rawData = '';
        req.on('data', (chunk: string) => {
            rawData += chunk;
        });
        req.on('end', () => {
            resolve(rawData);
        });
        req.on('error', (err: any) => {
            reject(err);
        });
    });
    const parsedBody = JSON.parse(body);

    parsedBody.userAgent = req.headers['user-agent'];

    const session = await getSession({ req });
    if (session) {
        const { name, email, image } = session.user;
        parsedBody.name = name;
        parsedBody.email = email;
        parsedBody.avatarUrl = image;
    }
    if (process.env.FEEDBACK_URL) {
        await fetch(process.env.FEEDBACK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(parsedBody),
        });
    }

    return res;
});

export default route;
