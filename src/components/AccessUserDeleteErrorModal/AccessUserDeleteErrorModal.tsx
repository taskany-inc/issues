import { FC } from 'react';
import NextLink from 'next/link';
import { FormTitle, ModalContent, ModalHeader, Tip } from '@taskany/bricks';
import { warn0 } from '@taskany/colors';
import { IconExclamationCircleSolid } from '@taskany/icons';
import { Button, Link, Text } from '@taskany/bricks/harmony';

import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import ModalOnEvent, { ModalContext } from '../ModalOnEvent';
import { routes } from '../../hooks/router';
import { TextList, TextListItem } from '../TextList';

import { tr } from './AccessUserDeleteErrorModal.i18n';
import s from './AccessUserDeleteErrorModal.module.css';

export const AccessUserDeleteErrorModal: FC = () => (
    <ModalOnEvent view="warn" event={ModalEvent.AccessUserDeleteError}>
        <ModalHeader>
            <FormTitle color={warn0}>{tr('Cannot delete person now')}</FormTitle>
        </ModalHeader>
        <ModalContent>
            <Tip className={s.ModalContentTip} view="warning" icon={<IconExclamationCircleSolid size="s" />}>
                {tr('The user has actual goals')}
            </Tip>
            <Text size="s">{tr('Before deleting, you must move this goals to another person:')}</Text>
            <ModalContext.Consumer>
                {(ctx) => (
                    <TextList listStyle="none" className={s.ModalContentUserList}>
                        {ctx?.[ModalEvent.AccessUserDeleteError]?.goals.map((goal) => (
                            <NextLink key={goal._shortId} href={routes.goal(goal._shortId)} passHref legacyBehavior>
                                <Link>
                                    <TextListItem>
                                        <Text as="span" size="s" weight="bolder">
                                            {goal.title}
                                        </Text>
                                    </TextListItem>
                                </Link>
                            </NextLink>
                        ))}
                    </TextList>
                )}
            </ModalContext.Consumer>
            <Button
                view="warning"
                text={tr('Ok, got it')}
                onClick={dispatchModalEvent(ModalEvent.AccessUserDeleteError)}
                className={s.ModalContentButton}
            />
        </ModalContent>
    </ModalOnEvent>
);
