import React from 'react';
import { Column, Row } from '@react-email/components';

import { Typography } from './Typography';

const colors = {
    success: {
        bg: '#9BC789',
        text: '#203417',
    },
    warning: {
        bg: '#DB9640',
        text: '#1E1103',
    },
};

const tooltipStyles = {
    display: 'inline-block',
    padding: '8px 12px',
    borderRadius: '5px',
};

const textStyles: React.CSSProperties = {
    color: '#203417',
    textAlign: 'center',
};

const arrowStyles: React.CSSProperties = {
    border: '6px solid transparent',
};

interface TooltipProps {
    view: keyof typeof colors;
    text: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, view }) => {
    return (
        <Row>
            <Column style={{ width: '12px', verticalAlign: 'middle', textAlign: 'right' }}>
                <div style={{ ...arrowStyles, borderRightColor: colors[view].bg }} />
            </Column>
            <Column style={{ verticalAlign: 'middle' }}>
                <div style={{ ...tooltipStyles, backgroundColor: colors[view].bg }}>
                    <Typography style={{ ...textStyles, color: colors[view].text }} size="s">
                        {text}
                    </Typography>
                </div>
            </Column>
        </Row>
    );
};
