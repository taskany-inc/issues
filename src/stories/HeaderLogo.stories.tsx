import React from 'react';
import { ComponentMeta } from '@storybook/react';

import { PageHeaderLogo } from '../components/PageHeaderLogo';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    title: 'Taskany/HeaderLogo',
    component: PageHeaderLogo,
} as ComponentMeta<typeof HeaderLogo>;
export const HeaderLogo = () => <PageHeaderLogo />;
