import { useState } from 'react';

type Handler = (e: React.MouseEvent<HTMLElement, MouseEvent> | undefined) => void;

export const useClickSwitch = (): [boolean, Handler] => {
    const [on, setOn] = useState(true);

    const onClickSwitch: Handler = (e) => {
        if (e && e.target === e.currentTarget) {
            setOn(!on);
        }
    };

    return [on, onClickSwitch];
};
