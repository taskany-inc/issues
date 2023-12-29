import { FC } from 'react';
import styled from 'styled-components';
import NextLink from 'next/link';
import { FormTitle, ModalContent, ModalHeader, Tip, Text, Button } from '@taskany/bricks';
import { gapS, warn0 } from '@taskany/colors';
import { IconExclamationCircleSolid } from '@taskany/icons';

import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import ModalOnEvent, { ModalContext } from '../ModalOnEvent';
import { routes } from '../../hooks/router';

import { tr } from './AccessUserDeleteErrorModal.i18n';

const StyledTip = styled(Tip)`
    padding: ${gapS} 0;
`;

const StyledGoalList = styled.div`
    margin-top: ${gapS};
    display: flex;
    flex-direction: column;
`;

const StyledModalActions = styled.div`
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: flex-end;
`;

export const AccessUserDeleteErrorModal: FC = () => (
    <ModalOnEvent view="warn" event={ModalEvent.AccessUserDeleteError}>
        <ModalHeader>
            <FormTitle color={warn0}>{tr('Cannot delete person now')}</FormTitle>
        </ModalHeader>
        <ModalContent>
            <StyledTip view="warning" icon={<IconExclamationCircleSolid size="s" />}>
                {tr('The user has actual goals')}
            </StyledTip>
            <Text size="s">{tr('Before deleting, you must move this goals to another person:')}</Text>
            <ModalContext.Consumer>
                {(ctx) => (
                    <StyledGoalList>
                        {ctx?.[ModalEvent.AccessUserDeleteError]?.goals.map((goal) => (
                            <NextLink key={goal._shortId} href={routes.goal(goal._shortId)} passHref legacyBehavior>
                                <Text size="s" weight="bolder" as="a">
                                    {goal.title}
                                </Text>
                            </NextLink>
                        ))}
                    </StyledGoalList>
                )}
            </ModalContext.Consumer>
            <StyledModalActions>
                <Button
                    size="m"
                    view="warning"
                    text={tr('Ok, got it')}
                    onClick={dispatchModalEvent(ModalEvent.AccessUserDeleteError)}
                />
            </StyledModalActions>
        </ModalContent>
    </ModalOnEvent>
);
