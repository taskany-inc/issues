import mdit from 'markdown-it';

import type { FieldDiff } from '../../../types/common';

import { SendMailProps } from '.';

const md = mdit('default', {
    typographer: true,
});
const withBaseTmplStyles = (html: string) =>
    `${html} <style>blockquote { padding: 5px 10px; margin: 0 0 20px; border-left: 5px solid #eee }</style>`;
const absUrl = (s: string) => `${process.env.NEXTAUTH_URL}${s}`;
const renderQuote = (quote: string) =>
    quote
        .split('\n')
        .map((part: string) => `> ${part}`)
        .join('\n');
const renderNotice = () =>
    '_NB: you got this email because your are owner/issuer/participant/watcher of this goal or project._';
const renderFooter = () => `
____

© 2023 Taskany inc.
`;

interface GoalCommentedEmailProps {
    to: SendMailProps['to'];
    shortId: string;
    title: string;
    body: string;
    commentId: string;
    author?: string;
}

export const goalCommented = async ({
    to,
    shortId,
    title,
    author = 'Somebody',
    body,
    commentId,
}: GoalCommentedEmailProps) => {
    const goalUrl = absUrl(`/goals/${shortId}`);
    const replyUrl = `${goalUrl}#comment-${commentId}`;
    const subject = `🧑‍💻 ${author} commented on #${shortId}`;
    const html = md.render(`
🧑‍💻 **${author}** commented on **[${shortId}: ${title}](${goalUrl})**:

${renderQuote(body)}

🗣 [Reply](${replyUrl}) to this comment.

${renderNotice()}

${renderFooter()}`);

    return {
        to,
        subject,
        html: withBaseTmplStyles(html),
        text: subject,
    };
};

interface GoalStateUpdatedEmailProps {
    to: SendMailProps['to'];
    stateTitleBefore?: string;
    stateTitleAfter?: string;
    shortId: string;
    title: string;
    author?: string;
}

export const goalStateUpdated = async ({
    to,
    shortId,
    stateTitleBefore = 'Unknown',
    stateTitleAfter = 'Unknown',
    title,
    author = 'Somebody',
}: GoalStateUpdatedEmailProps) => {
    const subject = `ℹ️ Goal state was changed on #${shortId}`;
    const html = md.render(`
🧑‍💻 **${author}** changed goal state on **[${shortId}: ${title}](${absUrl(
        `/goals/${shortId}`,
    )})** from ~~\`${stateTitleBefore}\`~~ to \`${stateTitleAfter}\`.

${renderNotice()}

${renderFooter()}`);

    return {
        to,
        subject,
        html: withBaseTmplStyles(html),
        text: subject,
    };
};

interface GoalStateUpdatedWithCommentEmailProps {
    to: SendMailProps['to'];
    stateTitleBefore?: string;
    stateTitleAfter?: string;
    shortId: string;
    title: string;
    body: string;
    commentId: string;
    author?: string;
}

export const goalStateUpdatedWithComment = async ({
    to,
    shortId,
    stateTitleBefore = 'Unknown',
    stateTitleAfter = 'Unknown',
    title,
    author = 'Somebody',
    body,
    commentId,
}: GoalStateUpdatedWithCommentEmailProps) => {
    const goalUrl = absUrl(`/goals/${shortId}`);
    const replyUrl = `${goalUrl}#comment-${commentId}`;
    const subject = `ℹ️ Goal state was changed with a comment on #${shortId}`;
    const html = md.render(`
🧑‍💻 **${author}** changed goal state on **[${shortId}: ${title}](${goalUrl})** from ~~\`${stateTitleBefore}\`~~ to \`${stateTitleAfter}\`.

${renderQuote(body)}

📍 [Jump to the comment](${replyUrl}).

${renderNotice()}

${renderFooter()}`);

    return {
        to,
        subject,
        html: withBaseTmplStyles(html),
        text: subject,
    };
};

interface GoalUpdatedEmailProps {
    to: SendMailProps['to'];
    shortId: string;
    title: string;
    updatedFields: {
        title?: FieldDiff;
        description?: FieldDiff;
        estimate?: FieldDiff;
        priority?: FieldDiff;
    };
    author?: string;
}

export const goalUpdated = async ({
    to,
    shortId,
    title,
    updatedFields,
    author = 'Somebody',
}: GoalUpdatedEmailProps) => {
    const subject = `ℹ️ Goal #${shortId} was updated`;
    const html = md.render(`
🧑‍💻 **${author}** updated goal **[${shortId}: ${title}](${absUrl(`/goals/${shortId}`)})**.

${
    updatedFields.title
        ? `
Title:
\`\`\` diff
- ${updatedFields.title[0]}
+ ${updatedFields.title[1]}
\`\`\`
`
        : ''
}

${
    updatedFields.description
        ? `
Description:
\`\`\` diff
- ${updatedFields.description[0]}
+ ${updatedFields.description[1]}
\`\`\`
`
        : ''
}

${
    updatedFields.priority
        ? `
Priority:
\`\`\` diff
- ${updatedFields.priority[0]}
+ ${updatedFields.priority[1]}
\`\`\`
`
        : ''
}

${renderNotice()}

${renderFooter()}`);

    return {
        to,
        subject,
        html: withBaseTmplStyles(html),
        text: subject,
    };
};

interface GoalArchivedEmailProps {
    to: SendMailProps['to'];
    shortId: string;
    title: string;
    author?: string;
}

export const goalArchived = async ({ to, shortId, title, author = 'Somebody' }: GoalArchivedEmailProps) => {
    const subject = `ℹ️ Goal #${shortId} was archived`;
    const html = md.render(`
🧑‍💻 **${author}** archived goal **[${shortId}: ${title}](${absUrl(`/goals/${shortId}`)})**.

${renderNotice()}

${renderFooter()}`);

    return {
        to,
        subject,
        html: withBaseTmplStyles(html),
        text: subject,
    };
};

interface GoalAssignedEmailProps {
    to: SendMailProps['to'];
    shortId: string;
    title: string;
    author?: string;
}

// TODO: send notification to issuer if he is not author of changes
export const goalAssigned = async ({ to, shortId, title, author = 'Somebody' }: GoalAssignedEmailProps) => {
    const subject = `ℹ️ You was assigned to #${shortId}`;
    const html = md.render(`
🧑‍💻 **${author}** assigned goal **[${shortId}: ${title}](${absUrl(
        `/goals/${shortId}`,
    )})** on you. Congrats and good luck! 🎉

${renderFooter()}`);

    return {
        to,
        subject,
        html: withBaseTmplStyles(html),
        text: subject,
    };
};

interface GoalUnassignedEmailProps {
    to: SendMailProps['to'];
    shortId: string;
    title: string;
    author?: string;
}

// TODO: send notification to issuer if he is not author of changes
export const goalUnassigned = async ({ to, shortId, title, author = 'Somebody' }: GoalUnassignedEmailProps) => {
    const subject = `ℹ️ You was unassigned from #${shortId}`;
    const html = md.render(`
🧑‍💻 **${author}** unassigned you from goal **[${shortId}: ${title}](${absUrl(
        `/goals/${shortId}`,
    )})**. So sad and c u on the next goal! 🤗

${renderFooter()}`);

    return {
        to,
        subject,
        html: withBaseTmplStyles(html),
        text: subject,
    };
};

interface GoalCreatedEmailProps {
    to: SendMailProps['to'];
    projectKey: string;
    projectTitle: string;
    shortId: string;
    title: string;
    author?: string;
}

export const goalCreated = async ({
    to,
    projectKey,
    projectTitle,
    shortId,
    title,
    author = 'Somebody',
}: GoalCreatedEmailProps) => {
    const subject = `🎉 New goal in project #${projectKey}: ${projectTitle}`;
    const html = md.render(`
🧑‍💻 **${author}** created new goal **[${shortId}: ${title}](${absUrl(
        `/goals/${shortId}`,
    )})** in **[#${projectKey}: ${projectTitle}](${absUrl(`/projects/${projectKey}`)})**.

${renderNotice()}

${renderFooter()}`);

    return {
        to,
        subject,
        html: withBaseTmplStyles(html),
        text: subject,
    };
};
