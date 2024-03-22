import { Text } from '@react-email/components';
import React from 'react';

type ColorType = 'primary' | 'secondary' | 'ghost';

const weight = {
    thin: 300,
    regular: 400,
    semiBold: 500,
    bold: 700,
};

const size = {
    xs: 12,
    s: 14,
    m: 16,
    l: 18,
};

const colors: Record<ColorType, string> = {
    primary: '#E0E0E1',
    secondary: '#9B9BA1',
    ghost: '#68686E',
};

interface TypographyProps {
    /** 'primary' | 'secondary' | 'ghost' | string */
    color: ColorType | string;
    size: keyof typeof size;
    weight: keyof typeof weight;
    asHtml?: boolean;
    style: React.CSSProperties;
}

const baseTextStyles = {
    padding: 0,
    margin: 0,
};

function keyInColor(key: string): key is keyof typeof colors {
    return key in colors;
}

const calcWeight = (key: TypographyProps['weight']) => ({ fontWeight: weight[key] });
const calcSize = (key: TypographyProps['size']) => ({ fontSize: size[key] });
const calcColor = (key: TypographyProps['color']) => ({
    color: keyInColor(key) ? colors[key] : key,
    lineHeight: 1.4,
    fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
});

export const Typography: React.FC<React.PropsWithChildren<Partial<TypographyProps>>> = ({
    children,
    size = 'm',
    weight = 'regular',
    color = 'primary',
    asHtml,
    style,
}) => {
    return (
        <Text
            style={{
                ...baseTextStyles,
                ...calcColor(color),
                ...calcWeight(weight),
                ...calcSize(size),
                ...style,
            }}
            dangerouslySetInnerHTML={asHtml ? { __html: (children as string).replaceAll('\\n', '<br />') } : undefined}
        >
            {!asHtml ? children : null}
        </Text>
    );
};
