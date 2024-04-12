import { Dropdown, MenuItem, nullable, useCopyToClipboard } from '@taskany/bricks';
import { Card, CardContent, CardInfo, Text } from '@taskany/bricks/harmony';
import { ComponentProps, FC, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { IconClipboardOutline, IconMoreVerticalOutline } from '@taskany/icons';
import * as Sentry from '@sentry/nextjs';

import { RelativeTime } from '../RelativeTime/RelativeTime';
import { useClickSwitch } from '../../hooks/useClickSwitch';
import { notifyPromise } from '../../utils/notifyPromise';

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
                label: tr('Copy raw'),
                icon: <IconClipboardOutline size="xxs" />,
                onClick: onCopyDescription,
            },
        ];
    }, [onCopyDescription]);

    return (
        <Card>
            <CardInfo className={s.CardInfo} onClick={onDateViewTypeChange}>
                <RelativeTime kind={kind} className={s.CardInfoTime} isRelativeTime={isRelative} date={date} />
                {nullable(description, () => (
                    <Dropdown
                        items={dropdownItems}
                        renderTrigger={({ ref, onClick }) => (
                            <IconMoreVerticalOutline
                                size="xs"
                                ref={ref}
                                onClick={onClick}
                                className={s.DropdownTrigger}
                            />
                        )}
                        renderItem={({ item }) => (
                            <MenuItem key={item.label} ghost icon={item.icon} onClick={item.onClick}>
                                {item.label}
                            </MenuItem>
                        )}
                    />
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
