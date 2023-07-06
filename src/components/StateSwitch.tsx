import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import { gapM } from '@taskany/colors';
import { KeyCode, useKeyPress, useKeyboard } from '@taskany/bricks';
import { StateType } from '@prisma/client';

import { trpc } from '../utils/trpcClient';

import { State } from './State';

const Popup = dynamic(() => import('@taskany/bricks/components/Popup'));

interface StateObject {
    id: string;
    title: string;
    hue: number;
    type: StateType;
}

interface StateSwitchProps {
    state: StateObject;
    flowId?: string;

    onClick?: (val: StateObject) => void;
}

const StyledStates = styled.div`
    padding-left: ${gapM};
`;

const StateSwitch: React.FC<StateSwitchProps> = ({ state, flowId, onClick }) => {
    const popupRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLDivElement>(null);
    const [popupVisible, setPopupVisibility] = useState(false);
    const downPress = useKeyPress('ArrowDown');
    const upPress = useKeyPress('ArrowUp');
    const [cursor, setCursor] = useState<number>();

    const flowById = flowId ? trpc.flow.getById.useQuery(flowId) : undefined;

    const onClickOutside = useCallback(() => {
        setPopupVisibility(false);
    }, []);

    const onButtonClick = useCallback(() => {
        setPopupVisibility(!popupVisible);
    }, [popupVisible]);

    const onItemClick = useCallback(
        (s: StateObject) => () => {
            setPopupVisibility(false);
            onClick && onClick(s);
        },
        [onClick],
    );

    const [onESC] = useKeyboard([KeyCode.Escape], () => popupVisible && setPopupVisibility(false));

    const [onENTER] = useKeyboard([KeyCode.Enter], () => {
        if (flowById?.data?.states?.length && cursor) {
            onItemClick(flowById?.data?.states[cursor])();
            setPopupVisibility(false);
        }
    });

    useEffect(() => {
        const states = flowById?.data?.states;

        if (states?.length && downPress) {
            setCursor((prevState = 0) => (prevState < states.length - 1 ? prevState + 1 : prevState));
        }
    }, [flowById, downPress]);

    useEffect(() => {
        if (flowById?.data?.states?.length && upPress) {
            setCursor((prevState = 0) => (prevState > 0 ? prevState - 1 : prevState));
        }
    }, [flowById, upPress]);

    useEffect(() => {
        if (flowById?.data?.states?.length && state) {
            for (let currCursor = 0; currCursor < flowById?.data?.states.length; currCursor++) {
                if (flowById?.data?.states[currCursor].id === state.id) {
                    setCursor(currCursor);
                    break;
                }
            }
        }
    }, [flowById, state]);

    return (
        <>
            <span ref={popupRef} {...onESC} {...onENTER}>
                <State ref={buttonRef} title={state?.title} hue={state?.hue} onClick={onButtonClick} />
            </span>

            <Popup
                placement="right"
                overflow="hidden"
                visible={popupVisible && Boolean(flowById?.data?.states?.length)}
                onClickOutside={onClickOutside}
                reference={popupRef}
                interactive
                offset={[0, 4]}
            >
                <StyledStates>
                    {flowById?.data?.states
                        ?.filter((s) => s.id !== state.id)
                        .map((s: StateObject) => (
                            <State
                                key={s.id}
                                hue={s.hue}
                                title={s.title}
                                // focused={s.id === state?.id || cursor === i}
                                onClick={onItemClick(s)}
                            />
                        ))}
                </StyledStates>
            </Popup>
        </>
    );
};

export default StateSwitch;
