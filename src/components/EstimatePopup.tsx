import { useClickOutside, Popup, nullable, Text } from '@taskany/bricks';
import { gapS, danger10, warn0, gapXs } from '@taskany/colors';
import { ReactNode, useRef, useState, useCallback } from 'react';
import styled from 'styled-components';
import { IconExclamationSmallOutline } from '@taskany/icons';

import { Option } from '../types/estimate';

import { PopupProps, OutlinePopup } from './OutlinePopup';

const StyledWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
`;

const StyledErrorTrigger = styled.div`
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 100%;
    background-color: ${danger10};
    top: -2px;
    right: 0px;
    z-index: 1;
`;

const StyledWarningCircle = styled.div`
    width: 12px;
    height: 12px;
    background: ${warn0};
    border-radius: 100%;
    display: flex;
    align-items: center;
`;

const StyledWarningWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: ${gapXs};
`;

interface EstimatePopupProps {
    renderItem: (option: Option) => ReactNode;
    renderTrigger: (values: { onClick: () => void }) => ReactNode;
    onClose?: () => void;
    items: Option[];
    placement?: PopupProps['placement'];
    error?: { message?: string };
    warning?: { message?: string };
}

export const EstimatePopup: React.FC<EstimatePopupProps> = ({
    renderItem,
    renderTrigger,
    onClose,
    items,
    placement,
    error,
    warning,
}) => {
    const triggerRef = useRef<HTMLDivElement>(null);
    const popupContentRef = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    const errorRef = useRef<HTMLDivElement>(null);
    const [errorVisible, setErrorVisible] = useState(false);

    const onMouseEnter = useCallback(() => setErrorVisible(true), []);
    const onMouseLeave = useCallback(() => setErrorVisible(false), []);

    const onToggleVisible = useCallback(() => {
        setVisible((prev) => !prev);
    }, []);

    useClickOutside(triggerRef, (e) => {
        if (!popupContentRef.current?.contains(e.target as Node)) {
            setVisible(false);
            onClose?.();
        }
    });

    return (
        <div>
            {nullable(error, (err) => (
                <>
                    <StyledErrorTrigger ref={errorRef} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} />
                    <Popup tooltip view="danger" placement="top-start" visible={errorVisible} reference={errorRef}>
                        {err.message}
                    </Popup>
                </>
            ))}

            <div ref={triggerRef}>{renderTrigger({ onClick: onToggleVisible })}</div>

            <OutlinePopup
                visible={visible}
                placement={placement}
                reference={triggerRef}
                interactive
                minWidth={160}
                maxWidth={180}
            >
                <StyledWrapper ref={popupContentRef}>
                    {nullable(warning, (warn) => (
                        <StyledWarningWrapper>
                            <StyledWarningCircle>
                                <IconExclamationSmallOutline size="xxs" />
                            </StyledWarningCircle>
                            <Text color={warn0} size="xxs">
                                {warn.message}
                            </Text>
                        </StyledWarningWrapper>
                    ))}
                    {items.map((item) => renderItem?.(item))}
                </StyledWrapper>
            </OutlinePopup>
        </div>
    );
};
