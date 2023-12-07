import mdit from 'markdown-it';

import { SendMailProps } from '.';

type FieldDiff = [string | undefined | null, string | undefined | null];

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
const notice = "_NB: you got this email because  you're the owner/issuer/participant/watcher of this goal or project._";
const footer = `
____

© 2023 Taskany inc.
`;

interface GoalCommentedEmailProps {
    to: SendMailProps['to'];
    shortId: string;
    title: string;
    body: string;
    commentId: string;
    authorEmail: string;
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

${notice}

${footer}`);

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
    authorEmail: string;
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

${notice}

${footer}`);

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
    authorEmail: string;
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

${notice}

${footer}`);

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
    authorEmail: string;
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

${notice}

${footer}`);

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
    authorEmail: string;
    author?: string;
}

export const goalArchived = async ({ to, shortId, title, author = 'Somebody' }: GoalArchivedEmailProps) => {
    const subject = `ℹ️ Goal #${shortId} was archived`;
    const html = md.render(`
🧑‍💻 **${author}** archived goal **[${shortId}: ${title}](${absUrl(`/goals/${shortId}`)})**.

${notice}

${footer}`);

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
    authorEmail: string;
    author?: string;
}

// TODO: send notification to issuer if he is not author of changes
export const goalAssigned = async ({ to, shortId, title, author = 'Somebody' }: GoalAssignedEmailProps) => {
    const subject = `ℹ️ You were assigned to #${shortId}`;
    const html = md.render(`
🧑‍💻 **${author}** assigned goal **[${shortId}: ${title}](${absUrl(
        `/goals/${shortId}`,
    )})** to you. Congrats and good luck! 🎉

${footer}`);

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
    authorEmail: string;
    author?: string;
}

// TODO: send notification to issuer if he is not author of changes
export const goalUnassigned = async ({ to, shortId, title, author = 'Somebody' }: GoalUnassignedEmailProps) => {
    const subject = `ℹ️ You were unassigned from #${shortId}`;
    const html = md.render(`
🧑‍💻 **${author}** unassigned you from goal **[${shortId}: ${title}](${absUrl(
        `/goals/${shortId}`,
    )})**. So sad and c u on the next goal! 🤗

${footer}`);

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
    authorEmail: string;
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

${notice}

${footer}`);

    return {
        to,
        subject,
        html: withBaseTmplStyles(html),
        text: subject,
    };
};

interface childProjectCreatedProps {
    to: SendMailProps['to'];
    childKey: string;
    childTitle: string;
    projectKey: string;
    projectTitle: string;
    authorEmail: string;
    author?: string;
}

export const childProjectCreated = async ({
    to,
    childKey,
    childTitle,
    projectKey,
    projectTitle,
    author = 'Somebody',
}: childProjectCreatedProps) => {
    const subject = `🎉 New child project in #${projectKey}: ${projectTitle}`;
    const html = md.render(`
🧑‍💻 **${author}** created new project **[${childKey}: ${childTitle}](${absUrl(
        `/projects/${childKey}`,
    )})** in **[#${projectKey}: ${projectTitle}](${absUrl(`/projects/${projectKey}`)})**.

${notice}

${footer}`);

    return {
        to,
        subject,
        html: withBaseTmplStyles(html),
        text: subject,
    };
};

interface childProjectDeletedProps {
    to: SendMailProps['to'];
    childKey: string;
    childTitle: string;
    projectKey: string;
    projectTitle: string;
    authorEmail: string;
    author?: string;
}

export const childProjectDeleted = async ({
    to,
    childKey,
    childTitle,
    projectKey,
    projectTitle,
    author = 'Somebody',
}: childProjectDeletedProps) => {
    const subject = `🎉 Child project was removed from #${projectKey}: ${projectTitle}`;
    const html = md.render(`
🧑‍💻 **${author}** removed project **[${childKey}: ${childTitle}](${absUrl(
        `/projects/${childKey}`,
    )})** from **[#${projectKey}: ${projectTitle}](${absUrl(`/projects/${projectKey}`)})**.

${notice}

${footer}`);

    return {
        to,
        subject,
        html: withBaseTmplStyles(html),
        text: subject,
    };
};

interface ProjectUpdatedEmailProps {
    to: SendMailProps['to'];
    key: string;
    title: string;
    updatedFields: {
        title?: FieldDiff;
        description?: FieldDiff;
        participants?: FieldDiff;
    };
    authorEmail: string;
    author?: string;
}

export const projectUpdated = async ({
    to,
    key,
    title,
    updatedFields,
    author = 'Somebody',
}: ProjectUpdatedEmailProps) => {
    const subject = `ℹ️ Project #${key}: ${title} was updated`;
    const html = md.render(`
🧑‍💻 **${author}** updated project **[#${key}: ${title}](${absUrl(`/projects/${key}`)})**.

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
    updatedFields.participants
        ? `
Participants:
\`\`\` diff
- ${updatedFields.participants[0]}
+ ${updatedFields.participants[1]}
\`\`\`
`
        : ''
}
}

${notice}

${footer}`);

    return {
        to,
        subject,
        html: withBaseTmplStyles(html),
        text: subject,
    };
};

interface ProjectTransferedProps {
    to: SendMailProps['to'];
    key: string;
    title: string;
    authorEmail: string;
    author?: string;
}

export const projectTransfered = async ({ to, key, title, author = 'Somebody' }: ProjectTransferedProps) => {
    const subject = `Project #${key}: ${title} was transfered`;
    const html = md.render(`
🧑‍💻 **${author}** transfered project **[${key}: ${title}](${absUrl(
        `/projects/${key}`,
    )})** to you. You are new owner. Congrats! 🎉

${notice}

${footer}`);

    return {
        to,
        subject,
        html: withBaseTmplStyles(html),
        text: subject,
    };
};

interface PartnerProjectToGoalProps {
    to: SendMailProps['to'];
    key: string;
    title: string;
    authorEmail: string;
    author: string;
    partnerProject: {
        key?: string;
        title?: string;
    };
}

export const addPartnerProjectToGoal = async ({
    to,
    key,
    title,
    author,
    partnerProject,
}: PartnerProjectToGoalProps) => {
    const subject = `ℹ️ Added partner project to #${key}: ${title}`;
    const html = md.render(`
🧑‍💻 **${author}** added a partner project **[${partnerProject.key}: ${partnerProject.title}](${absUrl(
        `/projects/${partnerProject.key}`,
    )})** to **[${title}](${absUrl(`/goals/${key}`)})**.

${notice}

${footer}`);

    return {
        to,
        subject,
        html: withBaseTmplStyles(html),
        text: subject,
    };
};

export const removePartnerProjectToGoal = async ({
    to,
    key,
    title,
    author,
    partnerProject,
}: PartnerProjectToGoalProps) => {
    const subject = `ℹ️ Removed partner project from #${key}: ${title}`;
    const html = md.render(`
🧑‍💻 **${author}** removed a partner project **[${partnerProject.key}: ${partnerProject.title}](${absUrl(
        `/projects/${partnerProject.key}`,
    )})** from **[${title}](${absUrl(`/goals/${key}`)})**.

${notice}

${footer}`);

    return {
        to,
        subject,
        html: withBaseTmplStyles(html),
        text: subject,
    };
};
