import React, { ReactNode, useRef, useState, useCallback, ComponentProps } from 'react';
import styled from 'styled-components';
import { useClickOutside, Popup, nullable } from '@taskany/bricks';
import { gapS, danger10, radiusM } from '@taskany/colors';

import { EstimateProps, Estimate } from './Estimate/Estimate';

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

const StyledPopup = styled(Popup)`
    border-radius: ${radiusM};
    padding: ${gapS};
`;

export interface EstimatePopupProps extends EstimateProps {
    error?: { message?: string };
    renderTrigger: (values: { onClick: () => void }) => ReactNode;
    placement?: ComponentProps<typeof Popup>['placement'];
    onClose?: () => void;
    onOpen?: () => void;
}

export const EstimatePopup = React.forwardRef<HTMLDivElement, EstimatePopupProps>(
    ({ renderTrigger, onClose, onOpen, placement, error, value, onChange }, ref) => {
        const triggerRef = useRef<HTMLDivElement>(null);
        const popupContentRef = useRef<HTMLDivElement>(null);
        const [visible, setVisible] = useState(false);

        const errorRef = useRef<HTMLDivElement>(null);
        const [errorVisible, setErrorVisible] = useState(false);

        const onMouseEnter = useCallback(() => setErrorVisible(true), []);
        const onMouseLeave = useCallback(() => setErrorVisible(false), []);

        const onToggleVisible = useCallback(() => {
            setVisible((prev) => {
                if (prev) {
                    onClose?.();
                } else {
                    onOpen?.();
                }
                return !prev;
            });
        }, [onClose, onOpen]);

        useClickOutside(triggerRef, (e) => {
            if (!popupContentRef.current?.contains(e.target as Node)) {
                setVisible(false);
                onClose?.();
            }
        });

        return (
            <div ref={ref}>
                {nullable(error, (err) => (
                    <>
                        <StyledErrorTrigger ref={errorRef} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} />
                        <Popup tooltip view="danger" placement="top-start" visible={errorVisible} reference={errorRef}>
                            {err.message}
                        </Popup>
                    </>
                ))}

                <div ref={triggerRef}>{renderTrigger({ onClick: onToggleVisible })}</div>

                <StyledPopup
                    visible={visible}
                    placement={placement}
                    reference={triggerRef}
                    interactive
                    minWidth={180}
                    maxWidth={180}
                >
                    <Estimate value={value} onChange={onChange} ref={popupContentRef} />
                </StyledPopup>
            </div>
        );
    },
);
