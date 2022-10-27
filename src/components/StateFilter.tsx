import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import colorLayer from 'color-layer';

import { createFetcher } from '../utils/createFetcher';
import { pageContext } from '../utils/pageContext';
import { State } from '../../graphql/@generated/genql';
import { useKeyPress } from '../hooks/useKeyPress';
import { useKeyboard, KeyCode } from '../hooks/useKeyboard';

import { Button } from './Button';
import { Popup } from './Popup';
import { StateDropdownItem } from './StateDropdownItem';
import { FiltersMenuItem } from './FiltersMenuItem';

interface StateFilterProps {
    disabled?: React.ComponentProps<typeof Button>['disabled'];
    text: string;
    flowId?: string;
    filters?: Array<string>;

    onClick?: (selected: string[]) => void;
}

const mapThemeOnId = { light: 0, dark: 1 };

const fetcher = createFetcher((_, id: string) => ({
    flow: [
        {
            id,
        },
        {
            id: true,
            title: true,
            states: {
                id: true,
                title: true,
                hue: true,
                default: true,
            },
        },
    ],
}));

export const StateFilter: React.FC<StateFilterProps> = ({ text, flowId, filters, disabled, onClick }) => {
    const { data: session } = useSession();
    const popupRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [popupVisible, setPopupVisibility] = useState(false);
    const downPress = useKeyPress('ArrowDown');
    const upPress = useKeyPress('ArrowUp');
    const [cursor, setCursor] = useState<number>();
    const { data } = useSWR(flowId, (id) => fetcher(session?.user, id));
    const { theme } = useContext(pageContext);
    const [themeId, setThemeId] = useState(0); // default: dark
    const [selected, setSelected] = useState<Set<string>>(new Set(filters));

    useEffect(() => {
        theme && setThemeId(mapThemeOnId[theme]);
    }, [theme]);

    const colors = useMemo(
        () => data?.flow?.states?.map((f) => colorLayer(f.hue, 5, f.hue === 1 ? 0 : undefined)[themeId]) || [],
        [themeId, data?.flow?.states],
    );

    const onClickOutside = useCallback(() => {
        setPopupVisibility(false);
    }, []);

    const onButtonClick = useCallback(() => {
        setPopupVisibility(!popupVisible);
    }, [popupVisible]);

    const onItemClick = useCallback(
        (s: State) => () => {
            selected.has(s.id) ? selected.delete(s.id) : selected.add(s.id);
            setSelected(new Set(selected));

            onClick && onClick(Array.from(selected));
        },
        [onClick, selected],
    );

    const [onESC] = useKeyboard([KeyCode.Escape], () => popupVisible && setPopupVisibility(false));

    const [onENTER] = useKeyboard([KeyCode.Enter], () => {
        if (data?.flow?.states?.length && cursor) {
            onItemClick(data?.flow?.states[cursor])();
            setPopupVisibility(false);
        }
    });

    useEffect(() => {
        const states = data?.flow?.states;

        if (states?.length && downPress) {
            setCursor((prevState = 0) => (prevState < states.length - 1 ? prevState + 1 : prevState));
        }
    }, [data?.flow, downPress]);

    useEffect(() => {
        if (data?.flow?.states?.length && upPress) {
            setCursor((prevState = 0) => (prevState > 0 ? prevState - 1 : prevState));
        }
    }, [data?.flow, upPress]);

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
                visible={popupVisible && Boolean(data?.flow?.states?.length)}
                onClickOutside={onClickOutside}
                reference={popupRef}
                interactive
                minWidth={150}
                maxWidth={250}
                offset={[0, 4]}
            >
                <>
                    {data?.flow?.states?.map((s, i) => (
                        <StateDropdownItem
                            key={s.id}
                            hue={s.hue}
                            title={s.title}
                            hoverColor={colors[i]}
                            checked={selected?.has(s.id)}
                            onClick={onItemClick(s)}
                        />
                    ))}
                </>
            </Popup>
        </>
    );
};
