import { User, Tag as TagData, Estimate, State as StateData, Activity, Project } from '@prisma/client';
import styled, { css } from 'styled-components';
import { UserPic, Text, Tag, nullable, DoubleCaretRightCircleIcon } from '@taskany/bricks';
import { backgroundColor, gray7 } from '@taskany/colors';

import { ActivityFeedItem } from '../ActivityFeed';
import { IssueListItem } from '../IssueListItem';
import RelativeTime from '../RelativeTime/RelativeTime';
import { Priority } from '../../types/priority';
import { PriorityText } from '../PriorityText/PriorityText';
import { StateDot } from '../StateDot';
import { HistoryAction, Subject } from '../../types/history';

import { tr } from './HistoryRecord.i18n';

type WholeSubject = 'title' | 'description' | 'priority' | keyof Subject;

interface HistoryRecordProps {
    id: string;
    author: User | null;
    subject: WholeSubject;
    action: HistoryAction;
    children?: React.ReactNode;
    meta?: Record<string, unknown>;
    createdAt: Date;
}

interface HistoryChangeProps<T> {
    from?: T | null;
    to?: T | null;
}

const StyledActivityFeedItem = styled(ActivityFeedItem)`
    align-items: flex-start;
    grid-template-columns: 24px 1fr;
    justify-content: flex-start;
    padding-left: 4px;
    position: relative;
`;

const StyledHistoryRecordWrapper = styled.div`
    display: flex;
    gap: 0.25rem;
    flex: 1;
    line-height: 1.5;
    align-items: start;
    flex-wrap: nowrap;
`;

const StyledIssueListItem = styled(IssueListItem)<{ strike?: boolean }>`
    padding: 0;
    align-items: baseline;
    font-size: 12px;

    ${({ strike }) =>
        strike &&
        css`
            text-decoration: line-through;
            opacity: 0.7;
        `}

    & + &::before {
        content: ',';
        padding-right: 0.25em;
    }

    a {
        display: inline-flex;
    }
`;

const StyledText = styled(Text)<{ strike?: boolean }>`
    ${({ strike }) =>
        strike &&
        css`
            text-decoration: line-through;
            opacity: 0.7;
        `}
`;

const StyledTextWrapper = styled.div`
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25em;
    flex: 1;
`;

const StyledIcon = styled(DoubleCaretRightCircleIcon)`
    width: 24px;
    height: 24px;
    display: flex;
    background-color: ${backgroundColor};
    align-items: center;
    overflow: hidden;
    transform: translateY(-3px);
`;

export const HistorySimplifyRecord: React.FC<HistoryChangeProps<React.ReactNode>> = ({ from, to }) => (
    <>
        {nullable(from, (val) => (
            <>
                <Text size="xs">{tr('from')}</Text>
                {val}
            </>
        ))}
        {nullable(to, (val) => (
            <>
                <Text size="xs">{tr('to')}</Text>
                {val}
            </>
        ))}
    </>
);

export const HistoryRecord: React.FC<HistoryRecordProps> = ({ author, subject, action, createdAt, children }) => {
    const mapActions: Record<HistoryAction, string> = {
        change: tr('change'),
        edit: tr('edit'),
        remove: tr('remove'),
        delete: tr('delete'),
        add: tr('add'),
    };

    const mapSubjects: Record<WholeSubject, string> = {
        description: tr('description'),
        project: tr('project'),
        tags: tr('tags'),
        owner: tr('owner'),
        participants: tr('participant'),
        state: tr('state'),
        estimate: tr('estimate'),
        title: tr('title'),
        dependencies: tr('dependencies'),
        priority: tr('priority'),
    };
    return (
        <StyledActivityFeedItem>
            <StyledIcon size="m" color={gray7} />
            <StyledHistoryRecordWrapper>
                <UserPic size={18} src={author?.image} email={author?.email} />
                <StyledTextWrapper>
                    <Text size="xs" weight="bold">
                        {author?.nickname ?? author?.name ?? author?.email}
                    </Text>
                    <Text size="xs">
                        {mapActions[action]} {mapSubjects[subject]}
                    </Text>
                    {children}
                    <Text size="xs">
                        <RelativeTime date={createdAt} />
                    </Text>
                </StyledTextWrapper>
            </StyledHistoryRecordWrapper>
        </StyledActivityFeedItem>
    );
};

export const HistoryRecordDependency: React.FC<{
    issues: Array<React.ComponentProps<typeof IssueListItem>['issue']>;
    strike?: boolean;
}> = ({ issues, strike = false }) => {
    return (
        <>
            {issues.map((issue) => (
                <StyledIssueListItem issue={issue} key={issue.id} size="xs" strike={strike} />
            ))}
        </>
    );
};

const HistoryTags: React.FC<{ tags: { title: string; id: string }[] }> = ({ tags }) => {
    return (
        <>
            {tags.map((item) => (
                <Tag key={item.id} size="s" title={item.title} />
            ))}
        </>
    );
};

export const HistoryRecordTags: React.FC<HistoryChangeProps<TagData[]>> = ({ from, to }) => (
    <HistorySimplifyRecord
        from={from ? <HistoryTags tags={from} /> : null}
        to={to ? <HistoryTags tags={to} /> : null}
    />
);

export const HistoryRecordEstimate: React.FC<HistoryChangeProps<Estimate>> = ({ from, to }) => (
    <HistorySimplifyRecord
        from={from ? <Tag size="s" title={`${from.q}/${from.y}`} /> : null}
        to={to ? <Tag size="s" title={`${to.q}/${to.y}`} /> : null}
    />
);

export const HistoryRecordProject: React.FC<HistoryChangeProps<Project>> = ({ from, to }) => (
    <HistorySimplifyRecord
        from={from ? <Tag size="s" title={from.id} /> : null}
        to={to ? <Tag size="s" title={to.id} /> : null}
    />
);

export const HistoryRecordTextChange: React.FC<HistoryChangeProps<string>> = ({ from, to }) => (
    <HistorySimplifyRecord
        from={
            from ? (
                <StyledText size="xs" strike>
                    {from}
                </StyledText>
            ) : null
        }
        to={to ? <StyledText size="xs">{to}</StyledText> : null}
    />
);

export const HistoryRecordPriority: React.FC<HistoryChangeProps<Priority>> = ({ from, to }) => (
    <HistorySimplifyRecord
        from={
            from ? (
                <Text size="xs" weight="bold">
                    <PriorityText value={from} />
                </Text>
            ) : null
        }
        to={
            to ? (
                <Text size="xs" weight="bold">
                    <PriorityText value={to} />
                </Text>
            ) : null
        }
    />
);

const HistoryDottedState: React.FC<{ title: string; hue: number }> = ({ title, hue }) => (
    <>
        <StateDot hue={hue} size="s" />
        <Text size="xs">{title}</Text>
    </>
);

export const HistoryRecordState: React.FC<HistoryChangeProps<StateData>> = ({ from, to }) => (
    <HistorySimplifyRecord
        from={from ? <HistoryDottedState title={from.title} hue={from.hue} /> : null}
        to={to ? <HistoryDottedState title={to.title} hue={to.hue} /> : null}
    />
);

const HistoryParticipant: React.FC<{ name?: string | null; pic?: string | null }> = ({ name = 'unknown', pic }) => (
    <>
        <UserPic src={pic} size={18} />
        <Text size="xs" weight="bold">
            {name}
        </Text>
    </>
);

export const HistoryRecordParticipant: React.FC<HistoryChangeProps<Activity & { user: User | null }>> = ({
    from,
    to,
}) => (
    <HistorySimplifyRecord
        from={
            from ? (
                <HistoryParticipant
                    name={from.user?.nickname ?? from.user?.name ?? from.user?.email}
                    pic={from.user?.image}
                />
            ) : null
        }
        to={
            to ? (
                <HistoryParticipant name={to.user?.nickname ?? to.user?.name ?? to.user?.email} pic={to.user?.image} />
            ) : null
        }
    />
);
