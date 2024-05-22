import { nullable, useCopyToClipboard } from '@taskany/bricks';
import { Card, CardContent, CardInfo, Text } from '@taskany/bricks/harmony';
import { ComponentProps, FC, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { IconClipboardOutline, IconMoreVerticalOutline } from '@taskany/icons';
import * as Sentry from '@sentry/nextjs';

import { RelativeTime } from '../RelativeTime/RelativeTime';
import { useClickSwitch } from '../../hooks/useClickSwitch';
import { notifyPromise } from '../../utils/notifyPromise';
import { Dropdown, DropdownPanel, DropdownTrigger } from '../Dropdown/Dropdown';

import { tr } from './GoalContentHeader.i18n';
import s from './GoalContentHeader.module.css';

const Md = dynamic(() => import('../Md'));

interface GoalContentHeaderProps extends Pick<ComponentProps<typeof RelativeTime>, 'date' | 'kind'> {
    description?: string;
}

export const GoalContentHeader: FC<GoalContentHeaderProps> = ({ description, date, kind }) => {
    const [isRelative, onDateViewTypeChange] = useClickSwitch();

    const onError = useCallback((err: Error) => {
        Sentry.captureException(err);
    }, []);

    const [, copyValue] = useCopyToClipboard(onError);

    const onCopyDescription = useCallback(() => {
        if (!description) return;

        notifyPromise(copyValue(description), 'copy');
    }, [copyValue, description]);

    const dropdownItems = useMemo(() => {
        return [
            {
                id: 'copy',
                label: tr('Copy raw'),
                icon: <IconClipboardOutline size="xxs" />,
                onClick: onCopyDescription,
            },
        ];
    }, [onCopyDescription]);

    return (
        <Card className={s.GoalContentHeaderCard}>
            <CardInfo className={s.CardInfo} onClick={onDateViewTypeChange}>
                <RelativeTime kind={kind} className={s.CardInfoTime} isRelativeTime={isRelative} date={date} />
                {nullable(description, () => (
                    <Dropdown>
                        <DropdownTrigger
                            renderTrigger={({ onClick, ref }) => (
                                <IconMoreVerticalOutline
                                    size="xs"
                                    ref={ref}
                                    onClick={onClick}
                                    className={s.DropdownTrigger}
                                />
                            )}
                        />
                        <DropdownPanel
                            placement="bottom-start"
                            items={dropdownItems}
                            mode="single"
                            onChange={(props) => props.onClick?.()}
                            renderItem={({ item }) => (
                                <Text key={item.label} className={s.DropdownItem} onClick={item.onClick}>
                                    {item.icon}
                                    {item.label}
                                </Text>
                            )}
                        />
                    </Dropdown>
                ))}
            </CardInfo>

            <CardContent view="transparent">
                {description ? (
                    <Md>{description}</Md>
                ) : (
                    <Text size="s" weight="thin" className={s.CardCommentEmptyDescription}>
                        {tr('No description provided')}
                    </Text>
                )}
            </CardContent>
        </Card>
    );
};
