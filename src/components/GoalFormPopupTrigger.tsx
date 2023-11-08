import { useState, useRef, FC, ReactNode, MutableRefObject, useCallback } from 'react';
import styled from 'styled-components';
import { Popup, nullable } from '@taskany/bricks';
import { gapXs } from '@taskany/colors';

const StyledWrapper = styled.div`
    padding: ${gapXs};
`;

interface GoalFormPopupTriggerProps {
    children: ReactNode;
    renderTrigger: (props: { onClick: () => void; ref: MutableRefObject<HTMLDivElement | null> }) => ReactNode;
}

export const GoalFormPopupTrigger: FC<GoalFormPopupTriggerProps> = ({ children, renderTrigger }) => {
    const [visible, setVisible] = useState(false);
    const popupRef = useRef<HTMLDivElement | null>(null);

    const onClickOutside = useCallback(() => {
        setVisible(false);
    }, []);

    return (
        <>
            {renderTrigger({
                onClick: () => setVisible(true),
                ref: popupRef,
            })}
            <Popup
                placement="bottom-start"
                visible={visible}
                reference={popupRef}
                onClickOutside={onClickOutside}
                interactive
                minWidth={450}
                maxWidth={450}
                arrow
            >
                <StyledWrapper>{nullable(visible, () => children)}</StyledWrapper>
            </Popup>
        </>
    );
};
