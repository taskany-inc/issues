import { useRef } from 'react';
import styled from 'styled-components';
import { useClickOutside, useKeyboard, KeyCode, Popup, Button, Tabs, TabContent, TabsMenu } from '@taskany/bricks';
import { gray10, gapS, gapXs } from '@taskany/colors';
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

const StyledPopupWrapper = styled.div``;

const StyledTabs = styled(Tabs)`
    width: 500px;

    gap: ${gapS};

    ${TabsMenu} {
        width: 200px;
        max-width: 100%;
        flex-basis: auto;
    }

    ${TabContent} {
        max-height: 240px;
        display: flex;
        flex-direction: column;
        overflow: auto;
        box-sizing: border-box;
        flex: 1;
    }
`;

const StyledFilterPanelPopupFooter = styled.div`
    display: flex;
    padding: ${gapXs} ${gapS};
    align-items: center;
`;

const StyledActionWrapper = styled.div`
    display: flex;
    flex-wrap: nowrap;
    margin-left: auto;
    gap: ${gapS};
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
        <Popup reference={filterRef} interactive placement="bottom-start" arrow={false} visible={visible} {...onESC}>
            <StyledPopupWrapper key={String(visible)} ref={popupWrapperRef}>
                <StyledTabs active={activeTab} layout="vertical">
                    {children}
                </StyledTabs>
                <StyledFilterPanelPopupFooter>
                    <Tip title={tr('Pro tip!')} icon={<IconBulbOnOutline size="s" color={gray10} />}>
                        {tr('You can apply and save filters as preset.')}
                    </Tip>
                    <StyledActionWrapper>
                        <Button outline text={tr('Cancel')} onClick={() => switchVisible(false)} />
                        <Button view="primary" outline text={tr('Apply')} onClick={onApplyClick} />
                    </StyledActionWrapper>
                </StyledFilterPanelPopupFooter>
            </StyledPopupWrapper>
        </Popup>
    );
};
