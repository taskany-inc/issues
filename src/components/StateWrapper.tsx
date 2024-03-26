import styled, { CSSObject } from 'styled-components';
import { FC, PropsWithChildren, useEffect, useState } from 'react';
import { gray6 } from '@taskany/colors';

import { usePageContext } from '../hooks/usePageContext';

function calcSaturation(hue: number, forDarkTheme = false) {
    // eslint-disable-next-line no-nested-ternary
    return hue > 1 ? (forDarkTheme ? '80%' : '90%') : '0%';
}

const lightness = [
    /** light theme */
    { bg: '94%', stroke: '39%', bgHover: '90%', strokeHover: '39%' },
    // dark theme
    { bg: '8%', stroke: '63%', bgHover: '12%', strokeHover: '63%' },
] as const;

const color = '--state-color';
const sat = '--state-saturation';
const bg = '--state-bg';
const stroke = '--state-stroke';
const bgHover = `${bg}-hover`;
const strokeHover = `${stroke}-hover`;

const wrapAsCSSVar = (val: string) => `var(${val})`;

export const stateBg = wrapAsCSSVar(bg);
export const stateStroke = wrapAsCSSVar(stroke);
export const stateBgHover = wrapAsCSSVar(bgHover);
export const stateStrokeHover = wrapAsCSSVar(strokeHover);

const StyledWrapper = styled.span`
    display: contents;
`;

export const StateWrapper: FC<PropsWithChildren<{ hue?: number; className?: string }>> = ({
    hue = 0,
    className,
    children,
    ...props
}) => {
    const { themeId } = usePageContext();
    const [colors, setColors] = useState<CSSObject>({
        [color]: 'transparent',
        [sat]: '0%',
        [bg]: 'transparent',
        [stroke]: gray6,
        [bgHover]: 'transparent',
        [strokeHover]: gray6,
    });

    useEffect(() => {
        const current = lightness[themeId];
        if (current) {
            setColors({
                [color]: hue,
                [sat]: calcSaturation(hue),
                [bg]: `hsl(var(--state-color), var(--state-saturation), ${current.bg})`,
                [stroke]: `hsl(var(--state-color), var(--state-saturation), ${current.stroke})`,
                [bgHover]: `hsl(var(--state-color), var(--state-saturation), ${current.bgHover})`,
                [strokeHover]: `hsl(var(--state-color), var(--state-saturation), ${current.strokeHover})`,
            });
        }
    }, [themeId, hue]);

    return (
        <StyledWrapper className={className} style={colors} {...props}>
            {children}
        </StyledWrapper>
    );
};

export default StateWrapper;
