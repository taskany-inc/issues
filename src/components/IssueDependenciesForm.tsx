import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import styled from 'styled-components';

import { gapL, gapM } from '../design/@generated/themes';
import { Goal, UserAnyKind } from '../../graphql/@generated/genql';

import { FormTitle } from './FormTitle';
import { UserCompletionInput } from './UserCompletionInput';
import { IssueDependenciesList } from './IssueDependenciesList';

interface IssueDependenciesFormProps {
    issue: Goal;

    onChange?: (activities: string[]) => void;
}

const StyledCompletion = styled.div`
    padding: ${gapL} 0 ${gapM};
`;

export const IssueDependenciesForm: React.FC<IssueDependenciesFormProps> = ({ issue, onChange }) => {
    const t = useTranslations('IssueDependencies');
    const activities = useMemo(() => new Set<string>(issue.participants?.map((p) => p!.id)), [issue]);

    const onDependencyDelete = useCallback(
        (id: string) => () => {
            activities.delete(id);
            onChange && onChange(Array.from(activities));
        },
        [activities, onChange],
    );

    const onParticipantAdd = useCallback(
        (u: UserAnyKind) => {
            if (u.activity) {
                activities.add(u.activity.id);
            }

            onChange && onChange(Array.from(activities));
        },
        [activities, onChange],
    );

    return (
        <>
            <FormTitle>{t('Edit dependencies')}</FormTitle>

            <IssueDependenciesList
                title={t('Depends on')}
                dependencies={issue.dependsOn}
                onDelete={onDependencyDelete}
            />
            <IssueDependenciesList title={t('Blocks')} dependencies={issue.blocks} onDelete={onDependencyDelete} />
            <IssueDependenciesList title={t('Related')} dependencies={issue.relatedTo} onDelete={onDependencyDelete} />

            <StyledCompletion>
                <UserCompletionInput placeholder={t('Add dependency')} onClick={onParticipantAdd} />
            </StyledCompletion>
        </>
    );
};
