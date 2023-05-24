import { SendMailProps } from '.';

const absUrl = (s: string) => `${process.env.NEXTAUTH_URL}${s}`;

interface NewCommentEmailProps {
    to: SendMailProps['to'];
    goalId: string;
    commentId: string;
}

export const newComment = ({ to, goalId, commentId }: NewCommentEmailProps): SendMailProps => ({
    to,
    subject: `New comment on [${goalId}](${absUrl(`/goals/${goalId}`)})`,
    text: `new comment for ${absUrl(`/goals/${goalId}#comment-${commentId}`)}`,
    html: `<a href="${absUrl(`/goals/${goalId}#comment-${commentId}`)}">new comment</a> for <a href="${absUrl(
        `/goals/${goalId}`,
    )}">${goalId}</a>`,
});

// TODO: must be solved automatically
export interface EmailTemplatesPropsMap {
    newComment: NewCommentEmailProps;
}
