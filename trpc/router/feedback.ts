import { protectedProcedure, router } from '../trpcBackend';
import { createFeedbackSchema } from '../../src/schema/feedback';

export const feedback = router({
    create: protectedProcedure
        .input(createFeedbackSchema)
        .mutation(async ({ ctx, input: { title, description, href } }) => {
            if (!process.env.FEEDBACK_URL) {
                return;
            }
            const { name, email, image } = ctx.session.user;
            const userAgent = ctx.headers['user-agent'];
            const res = await fetch(process.env.FEEDBACK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    description,
                    href,
                    userAgent,
                    name,
                    email,
                    avatarUrl: image,
                }),
            });
            return res;
        }),
});
