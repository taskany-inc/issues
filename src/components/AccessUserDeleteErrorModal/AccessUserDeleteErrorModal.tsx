import { FC } from 'react';
import NextLink from 'next/link';
import { FormTitle, ModalContent, ModalHeader, Tip, Text } from '@taskany/bricks';
import { IconExclamationCircleSolid } from '@taskany/icons';
import { Button } from '@taskany/bricks/harmony';

import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import ModalOnEvent, { ModalContext } from '../ModalOnEvent';
import { routes } from '../../hooks/router';

import { tr } from './AccessUserDeleteErrorModal.i18n';
import s from './AccessUserDeleteErrorModal.module.css';

export const AccessUserDeleteErrorModal: FC = () => (
    <ModalOnEvent view="warn" event={ModalEvent.AccessUserDeleteError}>
        <ModalHeader>
            <FormTitle className={s.FormTitle}>{tr('Cannot delete person now')}</FormTitle>
        </ModalHeader>
        <ModalContent>
            <Tip className={s.Tip} view="warning" icon={<IconExclamationCircleSolid size="s" />}>
                {tr('The user has actual goals')}
            </Tip>
            <Text size="s">{tr('Before deleting, you must move this goals to another person:')}</Text>
            <ModalContext.Consumer>
                {(ctx) => (
                    <div className={s.GoalList}>
                        {ctx?.[ModalEvent.AccessUserDeleteError]?.goals.map((goal) => (
                            <NextLink key={goal._shortId} href={routes.goal(goal._shortId)} passHref legacyBehavior>
                                <Text size="s" weight="bolder" as="a">
                                    {goal.title}
                                </Text>
                            </NextLink>
                        ))}
                    </div>
                )}
            </ModalContext.Consumer>
            <div className={s.ModalActions}>
                <Button
                    view="warning"
                    text={tr('Ok, got it')}
                    onClick={dispatchModalEvent(ModalEvent.AccessUserDeleteError)}
                />
            </div>
        </ModalContent>
    </ModalOnEvent>
);
