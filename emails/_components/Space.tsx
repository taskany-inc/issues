import React from 'react';

const sizes = {
    xs: 10,
    s: 30,
    m: 40,
};

interface SpaceProps {
    size: keyof typeof sizes;
}

export const Space: React.FC<SpaceProps> = ({ size = 'm' }) => <div style={{ height: sizes[size] }} />;
