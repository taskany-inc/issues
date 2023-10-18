import { createContext, useContext, useState, SetStateAction, useMemo, useEffect } from 'react';
import {
    User,
    Tag as TagData,
    State as StateData,
    Activity,
    Project,
    GoalAchieveCriteria,
    Goal,
    Ghost,
    Priority,
} from '@prisma/client';
import styled, { css } from 'styled-components';
import { UserPic, Text, Tag, nullable, Button } from '@taskany/bricks';
import { IconDoubleCaretRightCircleSolid, IconDividerLineOutline } from '@taskany/icons';
import { backgroundColor, gray7 } from '@taskany/colors';

import { ActivityFeedItem } from '../ActivityFeed';
import { IssueListItem } from '../IssueListItem';
import { RelativeTime } from '../RelativeTime/RelativeTime';
import { decodeHistoryEstimate, formateEstimate } from '../../utils/dateTime';
import { getPriorityText } from '../PriorityText/PriorityText';
import { StateDot } from '../StateDot';
import { HistoryAction, HistoryRecordSubject } from '../../types/history';
import { calculateDiffBetweenArrays } from '../../utils/calculateDiffBetweenArrays';
import { Circle } from '../Circle';
import { useLocale } from '../../hooks/useLocale';
import { getUserName, prepareUserDataFromActivity } from '../../utils/getUserName';

import { tr } from './HistoryRecord.i18n';

type WholeSubject =
    | 'title'
    | 'estimate'
    | 'description'
    | 'priority'
    | 'goalAsCriteria'
    | 'criteriaState'
    | 'goalComplete'
    | 'goalInProgress'
    | keyof HistoryRecordSubject;

interface HistoryRecordProps {
    id: string;
    author: User | null;
    subject: WholeSubject;
    action: HistoryAction;
    children?: React.ReactNode;
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

    & ${Circle} {
        /* no-magic: this negative margin needs for align icon by center of first line in content */
        margin-top: -3px;
    }
`;

const StyledHistoryRecordWrapper = styled.div`
    display: flex;
    gap: 0.25rem;
    flex: 1;
    line-height: 1.5;
    align-items: start;
    flex-wrap: nowrap;
`;

const StyledIssueListItem = styled(IssueListItem)`
    padding: 0;
    font-size: 12px;

    & + &::before {
        content: ',';
        padding-right: 0.25em;
    }

    a {
        display: inline-flex;
    }
`;

const StyledTextWrapper = styled.div<{ multiline?: boolean }>`
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25em;
    flex: 1;

    ${({ multiline }) =>
        multiline &&
        css`
            align-items: flex-start;
        `}
`;

const StyledButton = styled(Button)`
    bottom: 5px;
`;

const StyledFlexReset = styled.div`
    width: 100%;
`;

interface HistoryRecordContext {
    setActionText: (value: SetStateAction<HistoryAction>) => void;
    setSubjectText: (value: SetStateAction<WholeSubject>) => void;
}

const RecordCtx = createContext<HistoryRecordContext>({
    setActionText: () => {},
    setSubjectText: () => {},
});

export const HistorySimplifyRecord: React.FC<{ withPretext?: boolean } & HistoryChangeProps<React.ReactNode>> = ({
    from,
    to,
    withPretext = true,
}) => (
    <>
        {nullable(from, (val) => (
            <>
                {nullable(withPretext, () => (
                    <Text size="xs">{tr('from')}</Text>
                ))}
                {val}
            </>
        ))}
        {nullable(to, (val) => (
            <>
                {nullable(withPretext, () => (
                    <Text size="xs">{tr('to')}</Text>
                ))}
                {val}
            </>
        ))}
    </>
);

export const HistoryMultilineRecord: React.FC<{ withPretext?: boolean } & HistoryChangeProps<React.ReactNode>> = ({
    from,
    to,
    withPretext = true,
}) => (
    <StyledFlexReset>
        {nullable(from, (val) => (
            <div>
                {nullable(withPretext, () => (
                    <Text as="span" size="xs">
                        {tr('from')}:{' '}
                    </Text>
                ))}
                {val}
            </div>
        ))}
        {nullable(to, (val) => (
            <div>
                {nullable(withPretext, () => (
                    <Text as="span" size="xs">
                        {tr('to')}:{' '}
                    </Text>
                ))}
                {val}
            </div>
        ))}
    </StyledFlexReset>
);

export const HistoryRecord: React.FC<HistoryRecordProps> = ({ author, subject, action, createdAt, children }) => {
    const translates = useMemo<Record<HistoryAction | WholeSubject, string>>(() => {
        return {
            change: tr('change'),
            edit: tr('edit'),
            remove: tr('remove'),
            delete: tr('delete'),
            add: tr('add'),
            replace: tr('replace'),
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
            criteria: tr('criteria'),
            goalAsCriteria: tr('goal as criteria'),
            criteriaState: tr('marked criteria'),
            goalComplete: tr('goal complete'),
            goalInProgress: tr('goal in progress'),
            complete: '',
            uncomplete: '',
            partnerProject: tr('partner project'),
        };
    }, []);

    const [actionText, setActionText] = useState(action);
    const [subjectText, setSubjectText] = useState(subject);

    return (
        <StyledActivityFeedItem>
            <RecordCtx.Provider value={{ setActionText, setSubjectText }}>
                <Circle size={24} backgroundColor={backgroundColor}>
                    <IconDoubleCaretRightCircleSolid size={24} color={gray7} />
                </Circle>
                <StyledHistoryRecordWrapper>
                    {/* FIXME: it must be UserBadge */}
                    <UserPic size={18} src={author?.image} email={author?.email} />
                    <StyledTextWrapper multiline={subject.toString() === 'description'}>
                        {nullable(author, (data) => (
                            <Text size="xs" weight="bold">
                                {getUserName(data)}
                            </Text>
                        ))}

                        <Text size="xs">
                            {translates[actionText]} {translates[subjectText]}
                        </Text>

                        {children}

                        <Text size="xs">
                            <RelativeTime date={createdAt} />
                        </Text>
                    </StyledTextWrapper>
                </StyledHistoryRecordWrapper>
            </RecordCtx.Provider>
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
                <Tag key={item.id} size="s">
                    {item.title}
                </Tag>
            ))}
        </>
    );
};

export const HistoryRecordTags: React.FC<HistoryChangeProps<TagData[]>> = ({ from, to }) => {
    const recordCtx = useContext(RecordCtx);

    const added = calculateDiffBetweenArrays(to, from);
    const removed = calculateDiffBetweenArrays(from, to);

    useEffect(() => {
        recordCtx.setActionText(() => {
            if (added.length && !removed.length) {
                return 'add';
            }

            if (!added.length && removed.length) {
                return 'remove';
            }

            return 'change';
        });
    }, [added.length, recordCtx, removed.length]);

    return (
        <HistorySimplifyRecord
            withPretext={added.length > 0 && removed.length > 0}
            from={nullable(removed, (rem) => (
                <HistoryTags tags={rem} />
            ))}
            to={nullable(added, (add) => (
                <HistoryTags tags={add} />
            ))}
        />
    );
};

export const HistoryRecordEstimate: React.FC<HistoryChangeProps<string>> = ({ from, to }) => {
    const locale = useLocale();

    return (
        // FIXME: it must be EstimateBadge
        <HistorySimplifyRecord
            withPretext={!!to}
            from={nullable(from ? decodeHistoryEstimate(from) : null, (fe) => (
                <Tag size="s">{formateEstimate(fe.date, { locale, type: fe.type })}</Tag>
            ))}
            to={nullable(to ? decodeHistoryEstimate(to) : null, (te) => (
                <Tag size="s">{formateEstimate(te.date, { locale, type: te.type })}</Tag>
            ))}
        />
    );
};

export const HistoryRecordProject: React.FC<HistoryChangeProps<Project>> = ({ from, to }) => (
    // FIXME: it must be ProjectBadge
    <HistorySimplifyRecord
        from={nullable(from, (f) => (
            <Tag size="s">{f.id}</Tag>
        ))}
        to={nullable(to, (t) => (
            <Tag size="s">{t.id}</Tag>
        ))}
    />
);

export const HistoryRecordPartnerProject: React.FC<HistoryChangeProps<Project>> = ({ from, to }) => (
    // FIXME: it must be ProjectBadge
    <HistorySimplifyRecord
        withPretext={false}
        from={nullable(from, (f) => (
            <Tag size="s">{f.id}</Tag>
        ))}
        to={nullable(to, (t) => (
            <Tag size="s">{t.id}</Tag>
        ))}
    />
);

export const HistoryRecordLongTextChange: React.FC<HistoryChangeProps<string>> = ({ from, to }) => {
    const [viewDestiption, setViewDescription] = useState(false);

    const handlerViewDescription = () => {
        setViewDescription(!viewDestiption);
    };

    return (
        <>
            <StyledButton
                ghost={!viewDestiption}
                outline={viewDestiption}
                iconRight={<IconDividerLineOutline size="xs" />}
                onClick={handlerViewDescription}
            />

            {viewDestiption && (
                <HistoryMultilineRecord
                    from={nullable(from, () => (
                        <Text as="span" size="xs" strike>
                            {from}
                        </Text>
                    ))}
                    to={nullable(to, () => (
                        <Text as="span" size="xs">
                            {to}
                        </Text>
                    ))}
                />
            )}
        </>
    );
};

export const HistoryRecordTextChange: React.FC<HistoryChangeProps<string>> = ({ from, to }) => {
    return (
        <HistorySimplifyRecord
            from={nullable(from, () => (
                <Text size="xs" strike>
                    {from}
                </Text>
            ))}
            to={nullable(to, () => (
                <Text size="xs">{to}</Text>
            ))}
        />
    );
};

export const HistoryRecordPriority: React.FC<HistoryChangeProps<Priority>> = ({ from, to }) => (
    <HistorySimplifyRecord
        from={
            from ? (
                <Text size="xs" weight="bold">
                    {getPriorityText(from.title)}
                </Text>
            ) : null
        }
        to={
            to ? (
                <Text size="xs" weight="bold">
                    {getPriorityText(to.title)}
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
        from={nullable(from, (f) => (
            <HistoryDottedState title={f.title} hue={f.hue} />
        ))}
        to={nullable(to, (t) => (
            <HistoryDottedState title={t.title} hue={t.hue} />
        ))}
    />
);

const HistoryParticipant: React.FC<{ name?: string | null; pic?: string | null; email?: string | null }> = ({
    name = 'unknown',
    pic,
    email,
}) => (
    <>
        <UserPic src={pic} size={18} email={email} />
        <Text size="xs" weight="bold">
            {name}
        </Text>
    </>
);

export const HistoryRecordParticipant: React.FC<
    HistoryChangeProps<Activity & { user: User | null; ghost: Ghost | null }>
> = ({ from, to }) => (
    <HistorySimplifyRecord
        withPretext={Boolean(from) && Boolean(to)}
        from={nullable(prepareUserDataFromActivity(from), (data) => (
            <HistoryParticipant name={getUserName(data)} email={data.email} pic={data.image} />
        ))}
        to={nullable(prepareUserDataFromActivity(to), (data) => (
            <HistoryParticipant name={getUserName(data)} email={data.email} pic={data.image} />
        ))}
    />
);

type CriteriaItem = GoalAchieveCriteria & {
    goalAsCriteria: (Goal & { state: StateData | null }) | null;
    strike?: boolean;
};

const HistoryRecordCriteriaItem: React.FC<CriteriaItem> = ({ goalAsCriteria, title, strike }) => {
    if (goalAsCriteria) {
        return (
            <StyledIssueListItem
                strike={strike}
                size="xs"
                issue={{
                    title: goalAsCriteria.title,
                    _shortId: `${goalAsCriteria.projectId}-${goalAsCriteria.scopeId}`,
                    id: goalAsCriteria.id,
                }}
            />
        );
    }

    return (
        <Text size="xs" weight="bold" strike={strike}>
            {title}
        </Text>
    );
};

export const HistoryRecordCriteria: React.FC<
    HistoryChangeProps<CriteriaItem> & {
        action: HistoryAction;
        strike?: boolean;
    }
> = ({ from, to, action }) => {
    const recordCtx = useContext(RecordCtx);

    const isChangeAction = ['complete', 'uncomplete'].includes(action);

    useEffect(() => {
        recordCtx.setSubjectText((prev) => {
            const target = from || to;
            if (target?.goalAsCriteria != null) {
                if (isChangeAction) {
                    if (action === 'complete') {
                        return 'goalComplete';
                    }
                    return 'goalInProgress';
                }
                return 'goalAsCriteria';
            }

            if (isChangeAction) {
                return 'criteriaState';
            }

            return prev;
        });
    }, [action, from, isChangeAction, recordCtx, to]);

    return (
        <HistorySimplifyRecord
            withPretext={from != null}
            from={nullable(from, (val) => (
                <HistoryRecordCriteriaItem {...val} strike />
            ))}
            to={nullable(to, (val) => (
                <>
                    <HistoryRecordCriteriaItem {...val} strike={action === 'remove'} />
                    {val?.goalAsCriteria && <Text size="xs">{tr('as criteria')}</Text>}
                    {nullable(isChangeAction, () => (
                        <Text size="xs">{tr(action === 'complete' ? 'as completed' : 'as uncompleted')}</Text>
                    ))}
                </>
            ))}
        />
    );
};
