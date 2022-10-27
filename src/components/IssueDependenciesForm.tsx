import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import styled from 'styled-components';

import { gapL, gapM } from '../design/@generated/themes';
import { Dependency, enumDependency, Goal, GoalDependencyToggleInput } from '../../graphql/@generated/genql';

import { FormTitle } from './FormTitle';
import { IssueDependenciesList } from './IssueDependenciesList';
import { IssueDependencyKindDropdown } from './IssueDependencyKindDropdown';
import { IssueSearchInput } from './IssueSearchInput';

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
`;

const IssueDependenciesForm: React.FC<IssueDependenciesFormProps> = ({ issue, onChange }) => {
    const t = useTranslations('IssueDependencies');
    const [kind, setKind] = useState<Dependency>();
    const [target, setTarget] = useState<Goal>();
    const [query, setQuery] = useState('');

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
        setTarget(g);
        setQuery(g.id);
    }, []);

    const onKindChange = useCallback(
        (kind: Dependency) => {
            if (!target) {
                return;
            }

            setKind(kind);
            setQuery('');

            onChange &&
                onChange({
                    id: issue.id,
                    target: target.id,
                    direction: true,
                    dependency: kind,
                });
        },
        [onChange, issue.id, target],
    );

    const disabled = !target;

    return (
        <>
            <FormTitle>{t('Edit dependencies')}</FormTitle>

            {Object.values(enumDependency).map((dependency) => (
                <IssueDependenciesList
                    key={dependency}
                    title={t(dependency)}
                    dependencies={issue[dependency]}
                    onDelete={onDependencyDelete(dependency)}
                />
            ))}

            <StyledCompletion>
                <IssueSearchInput query={query} placeholder={t('Add dependency')} onClick={onDependencyAdd} />

                <StyledDropdownContainer>
                    <IssueDependencyKindDropdown
                        disabled={disabled}
                        view="primary"
                        text={(kind && t(kind)) || t('Kind')}
                        onClick={onKindChange}
                    />
                </StyledDropdownContainer>
            </StyledCompletion>
        </>
    );
};

export default IssueDependenciesForm;
