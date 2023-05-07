import React, { useCallback } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import { gapS, gray8 } from '@taskany/colors';
import { Text, Link, nullable } from '@taskany/bricks';

import { dispatchModalEvent, ModalEvent } from '../../utils/dispatchModal';
import { IssueDependenciesList } from '../IssueDependenciesList/IssueDependenciesList';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';

import { tr } from './IssueDependencies.i18n';

const IssueDependenciesForm = dynamic(() => import('../IssueDependenciesForm/IssueDependenciesForm'));
const ModalOnEvent = dynamic(() => import('../ModalOnEvent'));

interface IssueDependenciesProps {
    issue: GoalByIdReturnType;

    onChange?: React.ComponentProps<typeof IssueDependenciesForm>['onChange'];
}

const StyledActionNotice = styled.div`
    padding: ${gapS} 0;
`;

const IssueDependencies: React.FC<IssueDependenciesProps> = ({ issue, onChange }) => {
    const issueHasDeps = issue?.dependsOn?.length || issue?.blocks?.length || issue?.relatedTo?.length;

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
                        {tr('Does issue have dependencies')}? —{' '}
                        <Link inline onClick={onDependenciesEdit}>
                            {tr('Add one')}
                        </Link>
                        .
                    </Text>
                </StyledActionNotice>
            ) : (
                <IssueDependenciesList issue={issue} onEdit={onChange ? onDependenciesEdit : undefined} />
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
