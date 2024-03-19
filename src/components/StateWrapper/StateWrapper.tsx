import { FC, PropsWithChildren, useEffect, useState } from 'react';
import cn from 'classnames';

import { usePageContext } from '../../hooks/usePageContext';

import s from './StateWrapper.module.css';

type StatesGlobalVars = Record<string, number>;

export type StateType = keyof StatesGlobalVars;

function calcSaturation(hue: number, forDarkTheme = false) {
    // eslint-disable-next-line no-nested-ternary
    return hue > 1 ? (forDarkTheme ? '80%' : '90%') : '0%';
}

const lightness = [
    /* light theme */
    { bg: '94%', stroke: '39%', bgHover: '90%', strokeHover: '39%' },

    /* dark theme */
    { bg: '8%', stroke: '63%', bgHover: '12%', strokeHover: '63%' },
] as const;

const color = '--state-color';
const sat = '--state-saturation';
const bg = '--state-bg';
const stroke = '--state-stroke';
const bgHover = `${bg}-hover` as const;
const strokeHover = `${stroke}-hover` as const;

const wrapAsCSSVar = <T extends string>(val: T): `var(${T})` => `var(${val})`;

export const stateBg = wrapAsCSSVar(bg);
export const stateStroke = wrapAsCSSVar(stroke);
export const stateBgHover = wrapAsCSSVar(bgHover);
export const stateStrokeHover = wrapAsCSSVar(strokeHover);

export const StateWrapper: FC<PropsWithChildren<{ hue?: number; className?: string }>> = ({
    hue = 0,
    className,
    children,
    ...props
}) => {
    const { themeId } = usePageContext();
    const [colors, setColors] = useState<Record<string, unknown>>({
        [color]: 'transparent',
        [sat]: '0%',
        [bg]: 'transparent',
        [stroke]: 'var(--gray6)',
        [bgHover]: 'transparent',
        [strokeHover]: 'var(--gray6)',
    });

    useEffect(() => {
        const current = lightness[themeId];
        if (current) {
            setColors({
                [color]: hue,
                [sat]: calcSaturation(hue),
                [bg]: `hsl(var(${color}), var(${sat}), ${current.bg})`,
                [stroke]: `hsl(var(${color}), var(${sat}), ${current.stroke})`,
                [bgHover]: `hsl(var(${color}), var(${sat}), ${current.bgHover})`,
                [strokeHover]: `hsl(var(${color}), var(${sat}), ${current.strokeHover})`,
            });
        }
    }, [themeId, hue]);

    return (
        <span className={cn(s.Wrapper, className)} style={colors} {...props}>
            {children}
        </span>
    );
};

export default StateWrapper;
