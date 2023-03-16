import React, { ChangeEvent, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import styled from 'styled-components';
import useSWR from 'swr';
import dynamic from 'next/dynamic';

import { Button } from '@common/Button';

import { gapL, gapM } from '../design/@generated/themes';
import { Dependency, enumDependency, Goal, GoalDependencyToggleInput } from '../../graphql/@generated/genql';
import { createFetcher } from '../utils/createFetcher';
import { usePageContext } from '../hooks/usePageContext';

import { FormTitle } from './FormTitle';
import { IssueDependenciesList } from './IssueDependenciesList';
import { FormInput } from './FormInput';
import { MenuItem } from './MenuItem';
import { GoalMenuItem } from './GoalMenuItem';
import { Icon } from './Icon';
import { ModalContent, ModalHeader } from './Modal';

const ComboBox = dynamic(() => import('./ComboBox'));
const Dropdown = dynamic(() => import('./Dropdown'));

interface IssueDependenciesFormProps {
    issue: Goal;

    onChange?: (input: GoalDependencyToggleInput) => void;
}

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
                key: true,
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

const IssueDependenciesForm: React.FC<IssueDependenciesFormProps> = ({ issue, onChange }) => {
    const { user } = usePageContext();
    const t = useTranslations('IssueDependencies');

    const [kind, setKind] = useState<Dependency>();
    const [target, setTarget] = useState<Goal>();
    const [query, setQuery] = useState('');
    const [completionVisible, setCompletionVisible] = useState(false);

    const { data: goalsData } = useSWR(query, (q) => goalsFetcher(user, q));
    const { data: depsKindData } = useSWR('depsKind', () => depsKindfetcher(user));

    const onDependencyDelete = useCallback(
        (dependency: keyof typeof enumDependency) => (id: string) => {
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
                <FormTitle>{t('Edit dependencies')}</FormTitle>
            </ModalHeader>

            <ModalContent>
                {Object.values(enumDependency).map((dependency) => (
                    <IssueDependenciesList
                        key={dependency}
                        title={t(dependency)}
                        dependencies={issue[dependency]}
                        onDelete={onDependencyDelete(dependency)}
                    />
                ))}

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
                                placeholder={t('Add dependency')}
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
                                        <Icon
                                            size="s"
                                            noWrap
                                            type={props.visible ? 'arrowUpSmall' : 'arrowDownSmall'}
                                        />
                                    }
                                    text={kind ? t(kind) : undefined}
                                    ref={props.ref}
                                    onClick={props.onClick}
                                />
                            )}
                            renderItem={(props) => (
                                <MenuItem
                                    key={props.item}
                                    focused={props.cursor === props.index}
                                    selected={props.item === kind}
                                    onClick={props.onClick}
                                    view="primary"
                                >
                                    {t(props.item)}
                                </MenuItem>
                            )}
                        />
                        <Button
                            disabled={disabled || !kind}
                            text={t('Add')}
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
