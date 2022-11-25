import React, { useCallback } from 'react';
import styled from 'styled-components';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';

import { enumDependency, Goal } from '../../graphql/@generated/genql';
import { gapS, gray8 } from '../design/@generated/themes';
import { dispatchModalEvent, ModalEvent } from '../utils/dispatchModal';
import { nullable } from '../utils/nullable';

import { Link } from './Link';
import { Text } from './Text';
import { IssueDependenciesList } from './IssueDependenciesList';

const IssueDependenciesForm = dynamic(() => import('./IssueDependenciesForm'));
const ModalOnEvent = dynamic(() => import('./ModalOnEvent'));

interface IssueDependenciesProps {
    issue: Goal;

    onChange?: React.ComponentProps<typeof IssueDependenciesForm>['onChange'];
}

const StyledActionNotice = styled.div`
    padding: ${gapS} 0;
`;

const IssueDependencies: React.FC<IssueDependenciesProps> = ({ issue, onChange }) => {
    const t = useTranslations('IssueDependencies');
    const issueHasDeps = issue.dependsOn?.length || issue.blocks?.length || issue.relatedTo?.length;

    const onDependenciesEdit = useCallback(() => {
        if (onChange) {
            dispatchModalEvent(ModalEvent.IssueDependenciesModal)();
        }
    }, [onChange]);

    return (
        <>
            {!issueHasDeps && onChange ? (
                <StyledActionNotice>
                    <Text size="s" color={gray8}>
                        {t('Does issue have dependencies')}? —{' '}
                        <Link inline onClick={onDependenciesEdit}>
                            {t('Add one')}
                        </Link>
                        .
                    </Text>
                </StyledActionNotice>
            ) : (
                <>
                    {Object.values(enumDependency).map((dependency) => (
                        <IssueDependenciesList
                            key={dependency}
                            title={t(dependency)}
                            dependencies={issue[dependency]}
                            onEdit={onDependenciesEdit}
                        />
                    ))}
                </>
            )}

            {nullable(onChange, () => (
                <ModalOnEvent event={ModalEvent.IssueDependenciesModal}>
                    <IssueDependenciesForm issue={issue} onChange={onChange} />
                </ModalOnEvent>
            ))}
        </>
    );
};

export default IssueDependencies;
