import React, { ChangeEvent, useCallback, useState } from 'react';
import styled from 'styled-components';
import useSWR from 'swr';
import { gapL, gapM } from '@taskany/colors';
import {
    Button,
    Dropdown,
    ComboBox,
    ArrowUpSmallIcon,
    ArrowDownSmallIcon,
    MenuItem,
    ModalHeader,
    ModalContent,
    FormInput,
    FormTitle,
} from '@taskany/bricks';

import { Dependency, enumDependency, Goal, GoalDependencyToggleInput } from '../../../graphql/@generated/genql';
import { createFetcher } from '../../utils/createFetcher';
import { usePageContext } from '../../hooks/usePageContext';
import { IssueDependenciesList } from '../IssueDependenciesList/IssueDependenciesList';
import { GoalMenuItem } from '../GoalMenuItem';

import { tr } from './IssueDependenciesForm.i18n';

interface IssueDependenciesFormProps {
    issue: Goal;

    onChange?: (input: GoalDependencyToggleInput) => void;
}

const StyledMenuItem = styled(MenuItem)`
    display: flex;
    align-items: baseline;
    justify-content: flex-start;
`;

const StyledCompletion = styled.div`
    position: relative;
    padding: 0 0 ${gapM};
    margin-top: ${gapL};
`;

const StyledDropdownContainer = styled.div`
    position: absolute;
    right: 8px;
    top: 8px;
    display: flex;
    align-items: center;
`;

const depsKindfetcher = createFetcher(() => ({
    goalDependencyKind: true,
}));

const goalsFetcher = createFetcher((_, query: string) => ({
    findGoal: [
        {
            query,
        },
        {
            id: true,
            title: true,
            description: true,
            activityId: true,
            ownerId: true,
            state: {
                id: true,
                title: true,
                hue: true,
            },
            estimate: {
                date: true,
                q: true,
                y: true,
            },
            createdAt: true,
            updatedAt: true,
            project: {
                id: true,
                title: true,
                description: true,
                flow: {
                    id: true,
                },
            },
            tags: {
                id: true,
                title: true,
                description: true,
            },
            watchers: {
                id: true,
            },
            stargizers: {
                id: true,
            },
            comments: {
                id: true,
            },
            participants: {
                id: true,
                user: {
                    email: true,
                    name: true,
                    image: true,
                },
                ghost: {
                    email: true,
                },
            },
        },
    ],
}));

const map: Record<Dependency, string> = {
    blocks: tr('blocks'),
    dependsOn: tr('dependsOn'),
    relatedTo: tr('relatedTo'),
};

const IssueDependenciesForm: React.FC<IssueDependenciesFormProps> = ({ issue, onChange }) => {
    const { user } = usePageContext();

    const [kind, setKind] = useState<Dependency>();
    const [target, setTarget] = useState<Goal>();
    const [query, setQuery] = useState('');
    const [completionVisible, setCompletionVisible] = useState(false);

    const { data: goalsData } = useSWR(query, (q) => goalsFetcher(user, q));
    const { data: depsKindData } = useSWR('depsKind', () => depsKindfetcher(user));

    const onDependencyDelete = useCallback(
        (id: string, dependency: keyof typeof enumDependency) => {
            onChange &&
                onChange({
                    id: issue.id,
                    target: id,
                    direction: false,
                    dependency,
                });
        },
        [onChange, issue],
    );

    const onDependencyAdd = useCallback((g: Goal) => {
        setCompletionVisible(false);
        setTarget(g);
        setQuery(g.id);
    }, []);

    const onKindChange = useCallback(
        (kind: Dependency) => {
            if (!target) {
                return;
            }

            setKind(kind);
        },
        [target],
    );

    const onSubmit = useCallback(() => {
        if (!target && !kind) {
            return;
        }

        setQuery('');
        setTarget(undefined);
        setKind(undefined);

        onChange &&
            onChange({
                id: issue.id,
                target: target?.id,
                direction: true,
                dependency: kind,
            });
    }, [target, kind, onChange, issue.id]);

    const disabled = !target;

    return (
        <>
            <ModalHeader>
                <FormTitle>{tr('Edit dependencies')}</FormTitle>
            </ModalHeader>

            <ModalContent>
                <IssueDependenciesList issue={issue} onDelete={onDependencyDelete} />

                <StyledCompletion>
                    <ComboBox
                        text={query}
                        value={query}
                        placement="top-start"
                        offset={[-4, 38]}
                        visible={completionVisible}
                        items={goalsData?.findGoal}
                        onChange={onDependencyAdd}
                        renderInput={(props) => (
                            <FormInput
                                autoFocus
                                placeholder={tr('Add dependency')}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                    setQuery(e.currentTarget.value);
                                    setCompletionVisible(true);
                                }}
                                {...props}
                            />
                        )}
                        renderItem={(props) => (
                            <GoalMenuItem
                                key={props.item.id}
                                id={props.item.id}
                                title={props.item.title}
                                focused={props.cursor === props.index}
                                onClick={props.onClick}
                            />
                        )}
                    />

                    <StyledDropdownContainer>
                        <Dropdown
                            items={depsKindData?.goalDependencyKind}
                            onChange={onKindChange}
                            renderTrigger={(props) => (
                                <Button
                                    disabled={disabled}
                                    view="primary"
                                    outline
                                    brick="right"
                                    iconRight={
                                        props.visible ? (
                                            <ArrowUpSmallIcon size="s" noWrap />
                                        ) : (
                                            <ArrowDownSmallIcon size="s" noWrap />
                                        )
                                    }
                                    text={kind ? map[kind] : undefined}
                                    ref={props.ref}
                                    onClick={props.onClick}
                                />
                            )}
                            renderItem={(props) => (
                                <StyledMenuItem
                                    key={props.item}
                                    focused={props.cursor === props.index}
                                    selected={props.item === kind}
                                    onClick={props.onClick}
                                    view="primary"
                                >
                                    {map[props.item as Dependency]}
                                </StyledMenuItem>
                            )}
                        />
                        <Button
                            disabled={disabled || !kind}
                            text={tr('Add one')}
                            view="primary"
                            brick="left"
                            onClick={onSubmit}
                        />
                    </StyledDropdownContainer>
                </StyledCompletion>
            </ModalContent>
        </>
    );
};

export default IssueDependenciesForm;
