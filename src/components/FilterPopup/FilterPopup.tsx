import { useRef } from 'react';
import { useKeyboard, useClickOutside, KeyCode, Popup, Tabs, Tip, nullable } from '@taskany/bricks';
import { IconBulbOnOutline } from '@taskany/icons';
import { Button } from '@taskany/bricks/harmony';

import { tr } from './FilterPopup.i18n';
import s from './FilterPopup.module.css';

interface FilterPopupProps {
    visible: boolean;
    switchVisible: (val: boolean) => void;
    filterTriggerRef: React.RefObject<HTMLSpanElement>;
    onApplyClick: () => void;
    activeTab?: string;
}

export const FilterPopup: React.FC<React.PropsWithChildren<FilterPopupProps>> = ({
    activeTab,
    filterTriggerRef,
    visible,
    switchVisible,
    onApplyClick,
    children,
}) => {
    const popupWrapperRef = useRef<HTMLDivElement>(null);

    useClickOutside(filterTriggerRef, ({ target }) => {
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
        <>
            {nullable(visible, () => (
                <>
                    <div className={s.FilterPopupOverlay} />
                    <Popup
                        className={s.FilterPopup}
                        reference={filterTriggerRef}
                        interactive
                        placement="bottom-start"
                        visible={visible}
                        {...onESC}
                        offset={[0, 10]}
                    >
                        <div className={s.FilterPopupContent} key={String(visible)} ref={popupWrapperRef}>
                            <Tabs className={s.Tabs} active={activeTab} layout="vertical">
                                {children}
                            </Tabs>
                            <div className={s.FilterPopupFooter}>
                                <Tip
                                    className={s.FilterPopupTip}
                                    title={tr('Pro tip!')}
                                    size="xs"
                                    icon={<IconBulbOnOutline size="xs" className={s.FilterPopupTipIcon} />}
                                >
                                    {tr('You can apply and save filters as preset.')}
                                </Tip>
                                <div className={s.FilterPopupActions}>
                                    <Button text={tr('Cancel')} onClick={() => switchVisible(false)} />
                                    <Button view="primary" text={tr('Apply')} onClick={onApplyClick} />
                                </div>
                            </div>
                        </div>
                    </Popup>
                </>
            ))}
        </>
    );
};
