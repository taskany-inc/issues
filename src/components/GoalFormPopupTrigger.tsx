import { useState, useRef, FC, ReactNode, MutableRefObject, useCallback, ComponentProps } from 'react';
import styled from 'styled-components';
import { KeyCode, Popup, nullable, useKeyboard } from '@taskany/bricks';

const StyledWrapper = styled.div`
    padding: var(--gap-xs);
`;

interface GoalFormPopupTriggerProps {
    children: ReactNode;
    renderTrigger: (props: { onClick: () => void; ref: MutableRefObject<HTMLDivElement | null> }) => ReactNode;
    onClick?: () => void;
    onCancel?: () => void;
    placement?: ComponentProps<typeof Popup>['placement'];
    defaultVisible?: boolean;
}

export const GoalFormPopupTrigger: FC<GoalFormPopupTriggerProps> = ({
    children,
    renderTrigger,
    onClick,
    onCancel,
    placement = 'bottom-start',
    defaultVisible,
}) => {
    const [visible, setVisible] = useState(Boolean(defaultVisible));
    const popupRef = useRef<HTMLDivElement | null>(null);

    const onClickOutside = useCallback(() => {
        setVisible(false);
        onCancel?.();
    }, [onCancel]);

    const [onESC] = useKeyboard([KeyCode.Escape], () => {
        if (visible) {
            onClickOutside();
        }
    });

    const onClickHandler = useCallback(() => {
        setVisible(true);
        onClick?.();
    }, [onClick]);

    return (
        <>
            {renderTrigger({
                onClick: onClickHandler,
                ref: popupRef,
            })}
            <Popup
                placement={placement}
                visible={visible}
                reference={popupRef}
                onClickOutside={onClickOutside}
                interactive
                minWidth={450}
                maxWidth={450}
                arrow={false}
                {...onESC}
            >
                {nullable(visible, () => (
                    <StyledWrapper>{children}</StyledWrapper>
                ))}
            </Popup>
        </>
    );
};
