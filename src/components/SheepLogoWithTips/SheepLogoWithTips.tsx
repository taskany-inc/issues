import { FC, useRef, useState } from 'react';
import { Popup } from '@taskany/bricks/harmony';
import { SheepLogo } from '@taskany/bricks';

import { AllTips, getRandomIndex } from '../../utils/getRandomIndex';

import s from './SheepLogoWithTips.module.css';

const SheepLogoWithTips: FC = () => {
    const [index, setIndex] = useState(getRandomIndex());
    const [popupVisible, setPopupVisibility] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <Popup
                visible={popupVisible}
                placement="bottom-start"
                arrow={false}
                reference={popupRef}
                className={s.TipIcon}
                onClickOutside={() => setPopupVisibility(false)}
            >
                {AllTips[index]}
            </Popup>
            <div ref={popupRef}>
                <a
                    onClick={() => {
                        setPopupVisibility(true);
                        setIndex(getRandomIndex());
                    }}
                >
                    <SheepLogo />
                </a>
            </div>
        </>
    );
};

export default SheepLogoWithTips;
