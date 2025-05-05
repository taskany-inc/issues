import { NextApiHandler, NextApiRequest } from 'next';
import sharp from 'sharp';

import { db } from '../../../../utils/db/connection/kysely';

const queryHasScopeId = (
    query: NextApiRequest['query'],
): query is Required<NextApiRequest['query'] & { scopedId: string }> => {
    return query != null && Reflect.has(query, 'scopedId');
};

const svg = (color: string) => `
<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="${color}" />
</svg>
`;

const getBuffer = (content: string) =>
    sharp(Buffer.from(content))
        .resize(32, 32)
        .png()
        .flatten({
            background: {
                r: 0,
                g: 0,
                b: 0,
                alpha: 0,
            },
        })
        .toBuffer();

// const getGoalState = (pid: string, )

const handler: NextApiHandler = async (req, res) => {
    if (req.method !== 'GET') {
        res.status(422);
        res.send('Method not allowed');
        return;
    }

    const { query } = req;

    if (queryHasScopeId(query)) {
        const [pid, scopeId] = query.scopedId.split('-');

        const state = await db
            .selectFrom('Goal')
            .innerJoin('State', 'State.id', 'Goal.stateId')
            .select(['State.lightForeground'])
            .where('Goal.projectId', '=', pid)
            .where('Goal.scopeId', '=', Number(scopeId))
            .executeTakeFirst();

        if (state?.lightForeground == null) {
            res.status(404);
            res.send('Goal not found');
            return;
        }

        const toPng = svg(state.lightForeground);

        const png = await getBuffer(toPng);

        res.setHeader('Content-Type', 'image/png');

        res.send(png);
        return;
    }

    res.status(400);
    res.send('Bad request');
};

export default handler;
