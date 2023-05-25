import React, { ChangeEvent, useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
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

import { IssueDependenciesList } from '../IssueDependenciesList/IssueDependenciesList';
import { GoalMenuItem } from '../GoalMenuItem';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { trpc } from '../../utils/trpcClient';
import { dependencyKind, ToggleGoalDependency } from '../../schema/goal';

import { tr } from './IssueDependenciesForm.i18n';

interface IssueDependenciesFormProps {
    issue: GoalByIdReturnType;

    onChange?: (input: ToggleGoalDependency) => void;
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

const IssueDependenciesForm: React.FC<IssueDependenciesFormProps> = ({ issue, onChange }) => {
    const [kind, setKind] = useState<dependencyKind>();
    const [target, setTarget] = useState<GoalByIdReturnType>();
    const [query, setQuery] = useState<string[]>([]);
    const [completionVisible, setCompletionVisible] = useState(false);

    const { data: goalsData } = trpc.goal.suggestions.useQuery(query.join('-'));

    const dependKeys = useMemo(
        () => ({
            [dependencyKind.blocks]: tr('blocks'),
            [dependencyKind.dependsOn]: tr('dependsOn'),
            [dependencyKind.relatedTo]: tr('relatedTo'),
        }),
        [],
    );

    const onDependencyDelete = useCallback(
        (id: string, kind: dependencyKind) => {
            issue &&
                onChange &&
                onChange({
                    id: issue.id,
                    target: id,
                    direction: false,
                    kind,
                });
        },
        [onChange, issue],
    );

    const onDependencyAdd = useCallback((g: NonNullable<GoalByIdReturnType>) => {
        setCompletionVisible(false);
        setTarget(g);
        setQuery([g.projectId!, String(g.scopeId)]);
    }, []);

    const onKindChange = useCallback(
        (kind: dependencyKind) => {
            if (!target) {
                return;
            }

            setKind(kind);
        },
        [target],
    );

    const onSubmit = useCallback(() => {
        setQuery(['']);
        setTarget(undefined);
        setKind(undefined);

        target &&
            kind &&
            issue &&
            onChange &&
            onChange({
                id: issue.id,
                target: target.id,
                direction: true,
                kind,
            });
    }, [target, kind, onChange, issue]);

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
                        text={query.join('-')}
                        value={query.join('-')}
                        placement="top-start"
                        offset={[-4, 38]}
                        visible={completionVisible}
                        items={goalsData}
                        onChange={onDependencyAdd}
                        renderInput={(props) => (
                            <FormInput
                                autoFocus
                                placeholder={tr('Add dependency')}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                    setQuery([e.currentTarget.value]);
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
                            items={Object.values(dependencyKind)}
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
                                    text={kind ? dependKeys[kind] : undefined}
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
                                    {dependKeys[props.item as dependencyKind]}
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
