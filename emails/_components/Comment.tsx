import React from 'react';
import { nullable } from '@taskany/bricks';

import { getUserName } from '../../src/utils/getUserName';

import { hslToHex, getHslValues, md } from './utils';
import { Typography } from './Typography';

interface CommentProps {
    user: {
        nickname?: string;
        name?: string;
        email: string;
    };
    state?: {
        title: string;
        color?: string;
    };
    body: string;
}

const dotStyles = {
    borderRadius: '50%',
    width: '6px',
    height: '6px',
    display: 'inline-block',
    verticalAlign: 'middle',
    margin: '0 6px',
};

const blockStyles = {};

const headerStyles = {
    padding: '0px 10px 4px',
    borderTopLeftRadius: '6px',
    borderTopRightRadius: '6px',
};

const bodyStyles = {
    padding: '10px',
    borderBottomLeftRadius: '6px',
    borderBottomRightRadius: '6px',
    backgroundColor: '#25252C',
};

const calcColors = (hsl?: string) => {
    // fallback to `draft` if hsl is undefined
    const base: [number, number, number] = hsl != null ? getHslValues(hsl) : [240, 9, 55];
    // shift lightness by 20 percents
    const textColorValues: [number, number, number] = [base[0], base[1], Math.min(base[2] - 45, base[2])];

    return {
        text: hslToHex(...base),
        base: hslToHex(...textColorValues),
    };
};

export const Comment: React.FC<CommentProps> = ({ state, user, body }) => {
    const stateColor = calcColors(state?.color);

    return (
        <div style={blockStyles}>
            <div style={{ ...headerStyles, backgroundColor: stateColor.base }}>
                <Typography
                    size="s"
                    weight="bold"
                    color={stateColor.text}
                    style={{ display: 'inline', verticalAlign: 'middle' }}
                >
                    {getUserName(user)}
                </Typography>
                {nullable(state, (s) => (
                    <>
                        <span style={{ backgroundColor: stateColor.text, ...dotStyles }} />
                        <Typography
                            size="s"
                            weight="bold"
                            color={stateColor.text}
                            style={{
                                display: 'inline',
                                verticalAlign: 'middle',
                                marginLeft: '-0.25em',
                            }}
                        >
                            {s.title}
                        </Typography>
                    </>
                ))}
            </div>
            <div style={bodyStyles}>
                <Typography asHtml color="primary">
                    {md.renderInline(body)}
                </Typography>
            </div>
        </div>
    );
};
