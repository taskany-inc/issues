import {
    createContext,
    useContext,
    useState,
    SetStateAction,
    useMemo,
    useEffect,
    useCallback,
    forwardRef,
} from 'react';
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
import { UserPic, Text, Tag, nullable, Badge } from '@taskany/bricks';
import { Button } from '@taskany/bricks/harmony';
import {
    IconDoubleCaretRightCircleSolid,
    IconDividerLineOutline,
    IconRightSmallOutline,
    IconDownSmallOutline,
} from '@taskany/icons';
import { backgroundColor, gapS, gapXs, gray7, radiusXl } from '@taskany/colors';

import { ActivityFeedItem } from '../ActivityFeed';
import { IssueListItem } from '../IssueListItem';
import { RelativeTime } from '../RelativeTime/RelativeTime';
import { decodeHistoryEstimate, formateEstimate } from '../../utils/dateTime';
import { getPriorityText } from '../PriorityText/PriorityText';
import { StateDot } from '../StateDot';
import { HistoryRecordAction, HistoryRecordSubject, HistoryRecordWithActivity } from '../../types/history';
import { calculateDiffBetweenArrays } from '../../utils/calculateDiffBetweenArrays';
import { Circle } from '../Circle';
import { useLocale } from '../../hooks/useLocale';
import { getUserName, prepareUserDataFromActivity, safeGetUserName, safeUserData } from '../../utils/getUserName';

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

interface HistoryRecordInnerProps {
    id: string;
    author?: ReturnType<typeof safeUserData>;
    subject: WholeSubject;
    action: HistoryRecordAction;
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
    align-items: flex-start;
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

const StyledGroupHeaderWrapper = styled.div`
    display: flex;
    width: fit-content;
    align-items: center;
    gap: ${gapS};
    position: relative;
    background-color: ${backgroundColor};
    cursor: pointer;

    :after {
        content: '';
        position: absolute;
        top: 100%;
        height: 100%;
        left: 15px;
        border-left: 1px solid var(--gray5);
        z-index: 0;
    }
`;

const StyledIcon = styled(
    forwardRef<
        HTMLSpanElement,
        Omit<React.ComponentProps<typeof IconDownSmallOutline & typeof IconRightSmallOutline>, 'size'> & {
            collapsed?: boolean;
        }
    >(({ collapsed, ...props }, ref) => {
        return nullable(
            collapsed,
            () => <IconRightSmallOutline size="s" {...props} ref={ref} />,
            <IconDownSmallOutline size="s" {...props} ref={ref} />,
        );
    }),
)`
    /* no-magic: this negative margin needs for align icon by center of first line in content */
    margin-top: -3px;
`;

const StyledGroupHeader = styled(Text)`
    display: flex;
    width: fit-content;
    align-items: center;
    border: 1px solid ${gray7};
    border-radius: ${radiusXl};
    gap: ${gapXs};
    padding: ${gapXs} ${gapS};
    padding-right: ${gapXs};
    user-select: none;
`;

const StyledBadge = styled(Badge)`
    display: inline-flex;
    min-width: 20px;
    height: 20px;
    padding: 0;
    align-items: center;
    justify-content: center;
`;

interface HistoryRecordContext {
    setActionText: (value: SetStateAction<HistoryRecordAction>) => void;
    setSubjectText: (value: SetStateAction<WholeSubject>) => void;
}

const RecordCtx = createContext<HistoryRecordContext>({
    setActionText: () => {},
    setSubjectText: () => {},
});

const HistorySimplifyRecord: React.FC<{ withPretext?: boolean } & HistoryChangeProps<React.ReactNode>> = ({
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

const HistoryMultilineRecord: React.FC<{ withPretext?: boolean } & HistoryChangeProps<React.ReactNode>> = ({
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

const useHistoryTranslates = () => {
    return useMemo<Record<HistoryRecordAction | WholeSubject, string>>(() => {
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
            partnerProject: tr('partner project'),
            goalAsCriteria: tr('goal as criteria'),
            criteriaState: tr('marked criteria'),
            goalComplete: tr('goal complete'),
            goalInProgress: tr('goal in progress'),
            complete: '',
            uncomplete: '',
        };
    }, []);
};

const HistoryRecordInner: React.FC<HistoryRecordInnerProps> = ({ author, subject, action, createdAt, children }) => {
    const translates = useHistoryTranslates();

    const [actionText, setActionText] = useState(() => action);
    const [subjectText, setSubjectText] = useState(() => subject);

    return (
        <StyledActivityFeedItem>
            <RecordCtx.Provider value={{ setActionText, setSubjectText }}>
                <Circle size={24} backgroundColor={backgroundColor}>
                    <IconDoubleCaretRightCircleSolid size={24} color={gray7} />
                </Circle>
                <StyledHistoryRecordWrapper>
                    {/* FIXME: it must be UserBadge */}
                    <UserPic size={18} src={author?.image} email={author?.email} name={author?.name} />
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

const HistoryRecordDependency: React.FC<
    HistoryChangeProps<Array<React.ComponentProps<typeof IssueListItem>['issue']>> & { strike?: boolean }
> = ({ from, to, strike = false }) => {
    return (
        <>
            {(from || to || []).map((issue) => (
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

const HistoryRecordTags: React.FC<HistoryChangeProps<TagData[]>> = ({ from, to }) => {
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

const HistoryRecordEstimate: React.FC<HistoryChangeProps<string>> = ({ from, to }) => {
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

const HistoryRecordProject: React.FC<HistoryChangeProps<Project>> = ({ from, to }) => (
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

const HistoryRecordPartnerProject: React.FC<HistoryChangeProps<Project>> = ({ from, to }) => (
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

const HistoryRecordLongTextChange: React.FC<HistoryChangeProps<string>> = ({ from, to }) => {
    const [viewDescription, setViewDescription] = useState(false);

    const handlerViewDescription = () => {
        setViewDescription(!viewDescription);
    };

    return (
        <>
            <StyledButton
                view={!viewDescription ? undefined : 'checked'}
                iconRight={<IconDividerLineOutline size="xs" />}
                onClick={handlerViewDescription}
            />

            {viewDescription && (
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

const HistoryRecordTextChange: React.FC<HistoryChangeProps<string>> = ({ from, to }) => {
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

const HistoryRecordPriority: React.FC<HistoryChangeProps<Priority>> = ({ from, to }) => (
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

const HistoryRecordState: React.FC<HistoryChangeProps<StateData>> = ({ from, to }) => (
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
        <UserPic src={pic} size={18} email={email} name={name} />
        <Text size="xs" weight="bold">
            {name}
        </Text>
    </>
);

const HistoryRecordParticipant: React.FC<HistoryChangeProps<Activity & { user: User | null; ghost: Ghost | null }>> = ({
    from,
    to,
}) => (
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
    criteriaGoal: (Goal & { state: StateData | null }) | null;
    strike?: boolean;
};

const HistoryRecordCriteriaItem: React.FC<CriteriaItem> = ({ criteriaGoal, title, strike }) => {
    if (criteriaGoal) {
        return (
            <StyledIssueListItem
                strike={strike}
                size="xs"
                issue={{
                    title: criteriaGoal.title,
                    _shortId: `${criteriaGoal.projectId}-${criteriaGoal.scopeId}`,
                    id: criteriaGoal.id,
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

const HistoryRecordCriteria: React.FC<
    HistoryChangeProps<CriteriaItem> & {
        action: HistoryRecordAction;
        strike?: boolean;
    }
> = ({ from, to, action }) => {
    const recordCtx = useContext(RecordCtx);

    const isChangeAction = ['complete', 'uncomplete'].includes(action);

    useEffect(() => {
        recordCtx.setSubjectText((prev) => {
            const target = from || to;
            if (target?.criteriaGoal != null) {
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
                    {val?.criteriaGoal && <Text size="xs">{tr('as criteria')}</Text>}
                    {nullable(isChangeAction, () => (
                        <Text size="xs">{tr(action === 'complete' ? 'as completed' : 'as uncompleted')}</Text>
                    ))}
                </>
            ))}
        />
    );
};

type OuterSubjects = Exclude<WholeSubject, 'goalAsCriteria' | 'criteriaState' | 'goalComplete' | 'goalInProgress'>;

/**
 * let it be like this, with `any` props annotation
 * because a facade component `HistoryRecord` has correct typings for usage
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapSubjectToComponent: Record<OuterSubjects, React.FC<any>> = {
    dependencies: HistoryRecordDependency,
    criteria: HistoryRecordCriteria,
    participants: HistoryRecordParticipant,
    owner: HistoryRecordParticipant,
    project: HistoryRecordProject,
    partnerProject: HistoryRecordPartnerProject,
    state: HistoryRecordState,
    priority: HistoryRecordPriority,
    tags: HistoryRecordTags,
    title: HistoryRecordTextChange,
    estimate: HistoryRecordEstimate,
    description: HistoryRecordLongTextChange,
};

interface HistoryRecordProps extends Omit<HistoryRecordInnerProps, 'subject'> {
    subject: OuterSubjects;
    from?: HistoryRecordWithActivity['previousValue'];
    to?: HistoryRecordWithActivity['nextValue'];
}

export const HistoryRecord: React.FC<HistoryRecordProps> = ({ subject, author, action, createdAt, id, ...rest }) => {
    const Component = mapSubjectToComponent[subject];

    return (
        <HistoryRecordInner author={author} id={id} subject={subject} action={action} createdAt={createdAt}>
            <Component {...rest} action={action} />
        </HistoryRecordInner>
    );
};

const HisroryRecordGroupHeader: React.FC<
    React.PropsWithChildren<{
        createdAt: Date;
        collapsed: boolean;
        onClick: () => void;
    }>
> = ({ createdAt, onClick, collapsed, children }) => (
    <StyledGroupHeaderWrapper>
        <StyledGroupHeader onClick={onClick} size="xs">
            <StyledIcon collapsed={collapsed} />
            {children}
        </StyledGroupHeader>
        <Text size="xs">
            <RelativeTime date={createdAt} />
        </Text>
    </StyledGroupHeaderWrapper>
);

export const HistoryRecordGroup: React.FC<{
    subject: OuterSubjects;
    groupped?: boolean;
    values: HistoryRecordProps[];
}> = ({ values, subject }) => {
    const [collapsed, setCollapsed] = useState(() => values.length > 1);
    const showGroupHeader = values.length > 1;

    const translates = useHistoryTranslates();

    const heading = useMemo(() => {
        const authorsSet = new Set<string>();

        for (const { author } of values) {
            const name = safeGetUserName({ user: author });

            if (name) {
                authorsSet.add(name);
            }
        }

        const [first, ...rest] = Array.from(authorsSet);

        if (rest.length > 1) {
            return tr.raw('author and more made changes in', {
                author: <b>{first}</b>,
                count: rest.length,
                subject: translates[subject],
            });
        }

        if (rest.length) {
            return tr.raw('author and the other author made changes in', {
                author: <b>{first}</b>,
                oneMoreAuthor: <b>{rest[0]}</b>,
                subject: translates[subject],
            });
        }

        return tr.raw('author made changes in', { subject: translates[subject], author: <b>{first}</b> });
    }, [values, translates, subject]);

    const handleToggleCollapse = useCallback(() => setCollapsed((prev) => !prev), []);

    const lastRecord = values[values.length - 1];

    return (
        <>
            {nullable(showGroupHeader, () => (
                <HisroryRecordGroupHeader
                    onClick={handleToggleCollapse}
                    createdAt={lastRecord.createdAt}
                    collapsed={collapsed}
                >
                    {heading}
                    <StyledBadge size="s">{values.length}</StyledBadge>
                </HisroryRecordGroupHeader>
            ))}

            {nullable(!collapsed, () => (
                <>
                    {values.map(({ ...item }) => (
                        <HistoryRecord {...item} subject={item.subject} key={item.id} />
                    ))}
                </>
            ))}
        </>
    );
};
