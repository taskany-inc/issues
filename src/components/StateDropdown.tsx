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
import { Icon } from './Icon';
import { StateDot } from './StateDot';
import { StateDropdownItem } from './StateDropdownItem';

interface StateDropdownProps {
    text: React.ComponentProps<typeof Button>['text'];
    size?: React.ComponentProps<typeof Button>['size'];
    view?: React.ComponentProps<typeof Button>['view'];
    disabled?: React.ComponentProps<typeof Button>['disabled'];
    state?: State;
    flowId?: string;

    onClick?: (state: State) => void;
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

export const StateDropdown: React.FC<StateDropdownProps> = ({ size, text, state, view, flowId, disabled, onClick }) => {
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
        setPopupVisibility(true);
    }, []);

    const onItemClick = useCallback(
        (s: State) => () => {
            setPopupVisibility(false);
            onClick && onClick(s);
        },
        [onClick],
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

    useEffect(() => {
        if (data?.flow?.states?.length && state) {
            for (let currCursor = 0; currCursor < data?.flow?.states.length; currCursor++) {
                if (data?.flow?.states[currCursor].id === state.id) {
                    setCursor(currCursor);
                    break;
                }
            }
        }
    }, [data?.flow, state]);

    return (
        <>
            <span ref={popupRef} {...onESC} {...onENTER}>
                <Button
                    ref={buttonRef}
                    disabled={disabled}
                    size={size}
                    view={view}
                    text={text}
                    iconLeft={state ? <StateDot hue={state.hue} /> : <Icon noWrap type="flow" size="xs" />}
                    onClick={onButtonClick}
                />
            </span>

            <Popup
                placement="top-start"
                overflow="hidden"
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
                            focused={s.id === state?.id || cursor === i}
                            onClick={onItemClick(s)}
                        />
                    ))}
                </>
            </Popup>
        </>
    );
};
