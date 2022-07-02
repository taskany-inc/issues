import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { HeaderLogo } from '../components/HeaderLogo';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    title: 'Taskany/HeaderLogo',
    component: HeaderLogo,
} as ComponentMeta<typeof HeaderLogo>;
export const headerLogo = () => <HeaderLogo />;
