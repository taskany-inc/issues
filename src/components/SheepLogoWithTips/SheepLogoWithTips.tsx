import { FC, useRef, useState } from 'react';
import { Popup } from '@taskany/bricks/harmony';
import { SheepLogo } from '@taskany/bricks';

import { tr } from './SheepLogoWithTips.i18n';
import s from './SheepLogoWithTips.module.css';

const AllTips = [
    tr('Your smile is my favorite kind of sunlight. Have a nice day!'),
    tr('Good day!'),
    tr('Hurray! Something interesting awaits you today!'),
    tr('Life is wonderful!'),
    tr("Don't worry, be happy"),
];

const SheepLogoWithTips: FC = () => {
    const getRandomIndex = () => Math.floor(Math.random() * AllTips.length);
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
            <div
                onClick={() => {
                    setPopupVisibility(true);
                    setIndex(getRandomIndex());
                }}
                ref={popupRef}
            >
                <SheepLogo />
            </div>
        </>
    );
};

export default SheepLogoWithTips;
