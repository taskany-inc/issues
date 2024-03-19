import { Text, nullable } from '@taskany/bricks';
import { IconPlusCircleSolid, IconXCircleSolid } from '@taskany/icons';
import React, { ReactNode } from 'react';

import s from './EstimateOption.module.css';

interface EstimateOptionProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'className'> {
    title?: string;
    clue?: string | null;
    readOnly?: boolean;
    onClick?: () => void;
    onClose?: () => void;
    renderTrigger?: () => ReactNode;
}

export const EstimateOption: React.FC<EstimateOptionProps> = ({
    title,
    clue,
    readOnly,
    onClick,
    renderTrigger,
    onClose,
    ...attrs
}) => {
    return (
        <div className={s.EstimateOption}>
            <div className={s.EstimateOptionContent}>
                {nullable(title, (t) => (
                    <Text size="s">{t}</Text>
                ))}

                {nullable(
                    readOnly,
                    () => (
                        <IconPlusCircleSolid size="xs" className={s.EstimateOptionIcon} onClick={onClick} {...attrs} />
                    ),
                    <IconXCircleSolid size="xs" className={s.EstimateOptionIcon} onClick={onClose} {...attrs} />,
                )}
            </div>

            {nullable(clue, (c) => (
                <Text className={s.EstimateOptionClue} size="xs">
                    {c}
                </Text>
            ))}

            {nullable(!readOnly, () => renderTrigger?.())}
        </div>
    );
};
