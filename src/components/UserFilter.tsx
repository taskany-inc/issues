import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Activity } from '../../graphql/@generated/genql';
import { useKeyPress } from '../hooks/useKeyPress';
import { useKeyboard, KeyCode } from '../hooks/useKeyboard';
import { nullable } from '../utils/nullable';

import { Button } from './Button';
import { Popup } from './Popup';
import { FiltersMenuItem } from './FiltersMenuItem';
import { UserDropdownItem } from './UserDropdownItem';

interface UserFilterProps {
    disabled?: React.ComponentProps<typeof Button>['disabled'];
    text: string;
    activity?: Array<Activity | undefined>;

    onClick?: (selected: string[]) => void;
}

export const UserFilter: React.FC<UserFilterProps> = ({ text, activity, disabled, onClick }) => {
    const popupRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [popupVisible, setPopupVisibility] = useState(false);
    const downPress = useKeyPress('ArrowDown');
    const upPress = useKeyPress('ArrowUp');
    const [cursor, setCursor] = useState<number>();
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const onClickOutside = useCallback(() => {
        setPopupVisibility(false);
    }, []);

    const onButtonClick = useCallback(() => {
        setPopupVisibility(!popupVisible);
    }, [popupVisible]);

    const onItemClick = useCallback(
        (a?: Activity) => () => {
            selected.has(a!.id) ? selected.delete(a!.id) : selected.add(a!.id);
            setSelected(new Set(selected));

            onClick && onClick(Array.from(selected));
        },
        [onClick, selected],
    );

    const [onESC] = useKeyboard([KeyCode.Escape], () => popupVisible && setPopupVisibility(false));

    const [onENTER] = useKeyboard([KeyCode.Enter], () => {
        if (activity?.length && cursor) {
            onItemClick(activity[cursor])();
            setPopupVisibility(false);
        }
    });

    useEffect(() => {
        if (activity?.length && downPress) {
            setCursor((prevState = 0) => (prevState < activity.length - 1 ? prevState + 1 : prevState));
        }
    }, [activity, downPress]);

    useEffect(() => {
        if (activity?.length && upPress) {
            setCursor((prevState = 0) => (prevState > 0 ? prevState - 1 : prevState));
        }
    }, [activity, upPress]);

    return (
        <>
            <span ref={popupRef} {...onESC} {...onENTER}>
                <FiltersMenuItem
                    ref={buttonRef}
                    onClick={onButtonClick}
                    disabled={disabled}
                    active={Boolean(Array.from(selected).length)}
                >
                    {text}
                </FiltersMenuItem>
            </span>

            <Popup
                placement="top-start"
                visible={popupVisible && Boolean(activity?.length)}
                onClickOutside={onClickOutside}
                reference={popupRef}
                interactive
                minWidth={150}
                maxWidth={250}
                offset={[0, 4]}
            >
                <>
                    {activity?.map((a, i) =>
                        nullable(a, (ac) => (
                            <UserDropdownItem
                                key={ac.user!.id}
                                email={ac.user!.email}
                                name={ac.user!.name}
                                image={ac.user!.image}
                                checked={selected.has(ac.id)}
                                onClick={onItemClick(ac)}
                            />
                        )),
                    )}
                </>
            </Popup>
        </>
    );
};
