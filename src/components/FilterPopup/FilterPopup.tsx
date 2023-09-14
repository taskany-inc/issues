import { useRef } from 'react';
import styled from 'styled-components';
import { useClickOutside, useKeyboard, KeyCode, Popup, Button, Tabs, TabContent, TabsMenu } from '@taskany/bricks';
import { gray10, gapS, gapXs, textColor, gapM, radiusM } from '@taskany/colors';
import { IconBulbOnOutline } from '@taskany/icons';

import { Tip } from '../Tip';

import { tr } from './FilterPopup.i18n';

interface FilterPopupProps {
    visible: boolean;
    switchVisible: (val: boolean) => void;
    filterRef: React.RefObject<HTMLSpanElement>;
    onApplyClick: () => void;
    activeTab?: string;
}

const StyledPopupWrapper = styled.div`
    padding: ${gapXs};
`;

const StyledTabs = styled(Tabs)`
    width: 500px;
    height: 200px;

    gap: ${gapM};

    ${TabsMenu} {
        width: 200px;
        max-width: 100%;
        flex-basis: auto;
    }

    ${TabContent} {
        display: flex;
        flex-direction: column;
        overflow: auto;
        box-sizing: border-box;
        flex: 1;
    }
`;

const StyledPopup = styled(Popup)`
    border-radius: ${radiusM};
`;

const StyledFilterPanelPopupFooter = styled.div`
    display: flex;
    padding: ${gapXs} ${gapS};
    margin-top: ${gapXs};
    align-items: center;
`;

const StyledActionWrapper = styled.div`
    display: flex;
    flex-wrap: nowrap;
    margin-left: auto;
    gap: ${gapS};
`;
const StyledTip = styled(Tip)`
    color: ${gray10};
    font-size: 0.75rem;
    padding: 0;
`;

export const FilterPopup: React.FC<React.PropsWithChildren<FilterPopupProps>> = ({
    activeTab,
    filterRef,
    visible,
    switchVisible,
    onApplyClick,
    children,
}) => {
    const popupWrapperRef = useRef<HTMLDivElement>(null);

    useClickOutside(filterRef, ({ target }) => {
        if (visible && !popupWrapperRef.current?.contains(target as HTMLElement)) {
            switchVisible(false);
        }
    });

    const [onESC] = useKeyboard([KeyCode.Escape], () => {
        if (visible) {
            switchVisible(false);
        }
    });

    return (
        <StyledPopup
            reference={filterRef}
            interactive
            placement="bottom-start"
            visible={visible}
            {...onESC}
            offset={[-5, 0]}
        >
            <StyledPopupWrapper key={String(visible)} ref={popupWrapperRef}>
                <StyledTabs active={activeTab} layout="vertical">
                    {children}
                </StyledTabs>
                <StyledFilterPanelPopupFooter>
                    <StyledTip title={tr('Pro tip!')} icon={<IconBulbOnOutline size="s" color={textColor} />}>
                        {tr('You can apply and save filters as preset.')}
                    </StyledTip>
                    <StyledActionWrapper>
                        <Button outline text={tr('Cancel')} onClick={() => switchVisible(false)} />
                        <Button view="primary" outline text={tr('Apply')} onClick={onApplyClick} />
                    </StyledActionWrapper>
                </StyledFilterPanelPopupFooter>
            </StyledPopupWrapper>
        </StyledPopup>
    );
};
