import React, { createContext, useContext, useState, SetStateAction, useMemo, useEffect, ComponentProps } from 'react';
import {
    User as UserData,
    Tag as TagData,
    State as StateData,
    Activity,
    Project,
    GoalAchieveCriteria,
    Goal,
    Ghost,
    Priority,
    ExternalTask,
} from '@prisma/client';
import { nullable, formateEstimate } from '@taskany/bricks';
import {
    Button,
    HistoryRecord as HistoryRecordBricks,
    HistoryRecordCollapse as HistoryRecordCollapseBricks,
    Tag,
    Text,
} from '@taskany/bricks/harmony';
import { IconDividerLineOutline } from '@taskany/icons';
import cn from 'classnames';

import { RelativeTime } from '../RelativeTime/RelativeTime';
import { decodeHistoryEstimate } from '../../utils/dateTime';
import { getPriorityText } from '../PriorityText/PriorityText';
import { HistoryRecordAction, HistoryRecordSubject, HistoryRecordWithActivity } from '../../../trpc/queries/history';
import { calculateDiffBetweenArrays } from '../../utils/calculateDiffBetweenArrays';
import { useLocale } from '../../hooks/useLocale';
import { getUserName, prepareUserDataFromActivity, safeUserData } from '../../utils/getUserName';
import { UserBadge } from '../UserBadge/UserBadge';
import { ProjectBadge } from '../ProjectBadge';
import { getStateProps, GoalBadge } from '../GoalBadge';
import { JiraTaskBadge } from '../JiraTaskBadge/JiraTaskBadge';
import { routes } from '../../hooks/router';
import { State } from '../State';

import { tr } from './HistoryRecord.i18n';
import s from './HistoryRecord.module.css';

type WholeSubject =
    | 'title'
    | 'estimate'
    | 'description'
    | 'priority'
    | 'criteriaState'
    | 'goalComplete'
    | 'goalInProgress'
    | 'goalAsCriteria'
    | 'taskComplete'
    | 'taskInProgress'
    | 'taskAsCriteria'
    | keyof HistoryRecordSubject;

interface HistoryRecordInnerProps {
    id: string;
    author: ReturnType<typeof safeUserData>;
    subject: WholeSubject;
    action: HistoryRecordAction;
    children?: React.ReactNode;
    createdAt: Date;
}

interface HistoryChangeProps<T> {
    from?: T | null;
    to?: T | null;
}

const HistoryRecordText = ({ children, className, ...props }: ComponentProps<typeof Text>) => {
    return (
        <Text as="span" size="s" className={cn(s.HistoryRecordText, className)} {...props}>
            {children}
        </Text>
    );
};

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
                    <HistoryRecordText>{tr('from')} </HistoryRecordText>
                ))}
                {val}
            </>
        ))}
        {nullable(to, (val) => (
            <>
                {nullable(withPretext, () => (
                    <HistoryRecordText> {tr('to')} </HistoryRecordText>
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
    <div>
        {nullable(from, (val) => (
            <div>
                {nullable(withPretext, () => (
                    <HistoryRecordText>{tr('from')}: </HistoryRecordText>
                ))}
                {val}
            </div>
        ))}
        {nullable(to, (val) => (
            <div>
                {nullable(withPretext, () => (
                    <HistoryRecordText>{tr('to')}: </HistoryRecordText>
                ))}
                {val}
            </div>
        ))}
    </div>
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
            criteriaState: tr('marked criteria'),
            goalAsCriteria: tr('goal as criteria'),
            goalComplete: tr('goal complete'),
            goalInProgress: tr('goal in progress'),
            taskAsCriteria: tr('task as criteria'),
            taskComplete: tr('task complete'),
            taskInProgress: tr('task in progress'),
            complete: '',
            uncomplete: '',
        };
    }, []);
};

const HistoryRecordInner = ({ author, subject, action, createdAt, children }: HistoryRecordInnerProps) => {
    const translates = useHistoryTranslates();

    const [actionText, setActionText] = useState(() => action);
    const [subjectText, setSubjectText] = useState(() => subject);

    return (
        <RecordCtx.Provider value={{ setActionText, setSubjectText }}>
            {nullable(author, (user) => (
                <HistoryRecordBricks
                    authors={[user]}
                    title={user.name}
                    date={<RelativeTime date={createdAt} className={s.HistoryRecordTime} />}
                >
                    <HistoryRecordText as="div" weight="thin">
                        {translates[actionText]} {translates[subjectText]} {children}
                    </HistoryRecordText>
                </HistoryRecordBricks>
            ))}
        </RecordCtx.Provider>
    );
};

const HistoryRecordDependency: React.FC<
    HistoryChangeProps<
        {
            id: string;
            _shortId: string;
            title: string;
            state?: StateData;
        }[]
    >
> = ({ from, to }) => {
    return (
        <>
            {(from || to || []).map((issue) => (
                <GoalBadge
                    key={issue.id}
                    className={s.HistoryBadge}
                    title={issue.title}
                    state={getStateProps(issue.state)}
                    href={routes.goal(issue._shortId)}
                />
            ))}
        </>
    );
};

const HistoryTags: React.FC<{ tags: { title: string; id: string }[] }> = ({ tags }) => {
    return (
        <>
            {tags.map((item) => (
                <Tag key={item.id} className={s.HistoryInlineBadge}>
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
        <HistorySimplifyRecord
            withPretext={!!to}
            from={nullable(from ? decodeHistoryEstimate(from) : null, (fe) => (
                <HistoryRecordText className={s.HistoryRecordTextPrimary} strike size="s">
                    {formateEstimate(fe.date, { locale, type: fe.type })}
                </HistoryRecordText>
            ))}
            to={nullable(to ? decodeHistoryEstimate(to) : null, (te) => (
                <HistoryRecordText className={s.HistoryRecordTextPrimary} weight="semiBold" size="s">
                    {formateEstimate(te.date, { locale, type: te.type })}
                </HistoryRecordText>
            ))}
        />
    );
};

const HistoryRecordProject: React.FC<HistoryChangeProps<Project>> = ({ from, to }) => (
    <HistorySimplifyRecord
        from={nullable(from, (f) => (
            <ProjectBadge className={s.HistoryBadge} title={f.title} id={f.id} />
        ))}
        to={nullable(to, (t) => (
            <ProjectBadge className={s.HistoryBadge} title={t.title} id={t.id} />
        ))}
    />
);

const HistoryRecordPartnerProject: React.FC<HistoryChangeProps<Project>> = ({ from, to }) => (
    <HistorySimplifyRecord
        withPretext={false}
        from={nullable(from, (f) => (
            <ProjectBadge className={s.HistoryBadge} title={f.title} id={f.id} />
        ))}
        to={nullable(to, (t) => (
            <ProjectBadge className={s.HistoryBadge} title={t.title} id={t.id} />
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
            <Button
                className={s.HistoryRecordLongTextChangeButton}
                view={!viewDescription ? undefined : 'checked'}
                iconRight={<IconDividerLineOutline size="xs" />}
                onClick={handlerViewDescription}
            />

            {viewDescription && (
                <HistoryMultilineRecord
                    from={nullable(from, () => (
                        <HistoryRecordText className={s.HistoryRecordTextPrimary} strike size="s">
                            {from}
                        </HistoryRecordText>
                    ))}
                    to={nullable(to, () => (
                        <HistoryRecordText className={s.HistoryRecordTextPrimary} size="s">
                            {to}
                        </HistoryRecordText>
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
                <HistoryRecordText className={s.HistoryRecordTextPrimary} strike size="s">
                    {from}
                </HistoryRecordText>
            ))}
            to={nullable(to, () => (
                <HistoryRecordText className={s.HistoryRecordTextPrimary} size="s">
                    {to}
                </HistoryRecordText>
            ))}
        />
    );
};

const HistoryRecordPriority: React.FC<HistoryChangeProps<Priority>> = ({ from, to }) => (
    <HistorySimplifyRecord
        from={nullable(from, (f) => (
            <HistoryRecordText weight="semiBold" strike size="s" className={s.HistoryRecordTextPrimary}>
                {getPriorityText(f.title)}
            </HistoryRecordText>
        ))}
        to={nullable(to, (t) => (
            <HistoryRecordText weight="semiBold" size="s" className={s.HistoryRecordTextPrimary}>
                {getPriorityText(t.title)}
            </HistoryRecordText>
        ))}
    />
);

const HistoryRecordState: React.FC<HistoryChangeProps<StateData>> = ({ from, to }) => {
    return (
        <HistorySimplifyRecord
            from={nullable(from, (f) => (
                <State state={f} className={cn(s.HistoryInlineBadge, s.HistoryBadge)} />
            ))}
            to={nullable(to, (t) => (
                <State state={t} className={cn(s.HistoryInlineBadge, s.HistoryBadge)} />
            ))}
        />
    );
};

const HistoryRecordParticipant: React.FC<
    HistoryChangeProps<Activity & { user: UserData | null; ghost: Ghost | null }>
> = ({ from, to }) => (
    <HistorySimplifyRecord
        withPretext={Boolean(from) && Boolean(to)}
        from={nullable(prepareUserDataFromActivity(from), (data) => (
            <UserBadge
                name={getUserName(data)}
                email={data.email}
                image={data.image}
                className={cn(s.HistoryUserBadge, s.HistoryRecordTextPrimary)}
            />
        ))}
        to={nullable(prepareUserDataFromActivity(to), (data) => (
            <UserBadge
                name={getUserName(data)}
                email={data.email}
                image={data.image}
                className={cn(s.HistoryUserBadge, s.HistoryRecordTextPrimary)}
            />
        ))}
    />
);

type CriteriaItem = GoalAchieveCriteria & {
    criteriaGoal: (Goal & { state?: StateData }) | null;
    externalTask: ExternalTask | null;
    strike?: boolean;
};

const HistoryRecordCriteriaItem: React.FC<CriteriaItem> = ({ criteriaGoal, externalTask, title, strike }) => {
    if (criteriaGoal) {
        return (
            <GoalBadge
                className={cn(s.HistoryBadge, s.HistoryRecordTextPrimary)}
                title={criteriaGoal.title}
                state={getStateProps(criteriaGoal.state)}
                href={routes.goal(`${criteriaGoal.projectId}-${criteriaGoal.scopeId}`)}
                strike={strike}
            />
        );
    }

    if (externalTask) {
        return (
            <JiraTaskBadge
                className={cn(s.HistoryBadge, s.HistoryRecordTextPrimary)}
                state={{
                    title: externalTask.state,
                    color: externalTask.stateColor,
                }}
                taskKey={externalTask.externalKey}
                title={externalTask.title}
                href={routes.jiraTask(externalTask.externalKey)}
                strike={strike}
            />
        );
    }

    return (
        <HistoryRecordText weight="semiBold" size="s" strike={strike} className={s.HistoryRecordTextPrimary}>
            {title}
        </HistoryRecordText>
    );
};

const trKeyMap: Record<'criteriaGoal' | 'externalTask', Record<'default' | 'inProgress' | 'complete', WholeSubject>> = {
    criteriaGoal: {
        default: 'goalAsCriteria',
        inProgress: 'goalInProgress',
        complete: 'goalComplete',
    },
    externalTask: {
        default: 'taskAsCriteria',
        inProgress: 'taskInProgress',
        complete: 'taskComplete',
    },
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
            const translateMap =
                // eslint-disable-next-line no-nested-ternary
                target?.criteriaGoal != null
                    ? trKeyMap.criteriaGoal
                    : target?.externalTask != null
                    ? trKeyMap.externalTask
                    : null;

            if (translateMap) {
                if (isChangeAction) {
                    if (action === 'complete') {
                        return translateMap.complete;
                    }
                    return translateMap.inProgress;
                }
                return translateMap.default;
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
                    {nullable(val.criteriaGoal || val.externalTask, () => (
                        <HistoryRecordText>{tr('as criteria')}</HistoryRecordText>
                    ))}
                    {nullable(isChangeAction, () => (
                        <HistoryRecordText>
                            {' '}
                            {tr(action === 'complete' ? 'as completed' : 'as uncompleted')}
                        </HistoryRecordText>
                    ))}
                </>
            ))}
        />
    );
};

type BanSubjects =
    | 'goalAsCriteria'
    | 'criteriaState'
    | 'goalComplete'
    | 'goalInProgress'
    | 'taskAsCriteria'
    | 'taskComplete'
    | 'taskInProgress';

type OuterSubjects = Exclude<WholeSubject, BanSubjects>;

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

export const HistoryRecordGroup: React.FC<{
    subject: OuterSubjects;
    groupped?: boolean;
    values: HistoryRecordProps[];
}> = ({ values, subject }) => {
    const showGroupHeader = values.length > 1;

    const translates = useHistoryTranslates();

    const authors = useMemo(() => {
        const authorsSet = new Set<string>();
        const res: NonNullable<HistoryRecordInnerProps['author']>[] = [];

        for (const { author } of values) {
            const user = safeUserData({ user: author });

            if (user && !authorsSet.has(user.name)) {
                authorsSet.add(user.name);
                res.push(user);
            }
        }

        return res;
    }, [values]);

    const heading = useMemo(() => {
        const [_, ...rest] = authors;

        if (rest.length > 1) {
            return tr.raw('author and more made changes in', {
                count: rest.length,
                subject: translates[subject],
                space: String.fromCharCode(0xa0), // non-breakable space between preposition and letter
            });
        }

        if (rest.length) {
            return tr.raw('author and the other author made changes in', {
                oneMoreAuthor: <b>{rest[0].name}</b>,
                subject: translates[subject],
                space: String.fromCharCode(0xa0), // non-breakable space between preposition and letter
            });
        }

        return tr.raw('author made changes in', {
            subject: translates[subject],
            space: String.fromCharCode(0xa0), // non-breakable space between preposition and letter
        });
    }, [authors, translates, subject]);

    const lastRecord = values[values.length - 1];

    return (
        <>
            {nullable(
                showGroupHeader,
                () => (
                    <>
                        {' '}
                        <HistoryRecordBricks
                            authors={authors}
                            title={authors[0].name}
                            date={<RelativeTime className={s.HistoryRecordTime} date={lastRecord.createdAt} />}
                        >
                            <HistoryRecordText as="p" weight="thin">
                                {heading.map((part, index) => {
                                    let key = `${index}`;

                                    if (typeof part === 'string') {
                                        key = `${part}.${index}`;
                                    } else if (React.isValidElement(part)) {
                                        key = `HeadingComponent.${index}`;
                                    }

                                    return <React.Fragment key={key}>{part}</React.Fragment>;
                                })}{' '}
                                {tr('records count', { count: values.length })}
                            </HistoryRecordText>
                        </HistoryRecordBricks>
                        <HistoryRecordCollapseBricks translates={[tr('Collapse changes'), tr('Expand changes')]}>
                            {values.map((value) => (
                                <HistoryRecord {...value} key={`HeadingComponent.${value.id}.${value.subject}`} />
                            ))}
                        </HistoryRecordCollapseBricks>
                    </>
                ),
                values.map((value) => (
                    <HistoryRecord {...value} subject={value.subject} key={`${value.id}.${value.subject}`} />
                )),
            )}
        </>
    );
};
