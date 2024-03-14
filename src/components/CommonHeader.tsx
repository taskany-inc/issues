import { nullable } from '@taskany/bricks';

import { pageHeader, pageTitle } from '../utils/domObjects';

import { FiltersBar, FiltersBarItem, FiltersBarTitle } from './FiltersBar/FiltersBar';
import { Separator } from './Separator/Separator';
import { PageUserMenu } from './PageUserMenu';

interface CommonHeaderProps {
    title: React.ReactNode;
    children?: React.ReactNode;
}
export const CommonHeader: React.FC<CommonHeaderProps> = ({ title, children }) => (
    <FiltersBar {...pageHeader.attr}>
        <FiltersBarItem>
            <FiltersBarTitle {...pageTitle.attr}>{title}</FiltersBarTitle>
        </FiltersBarItem>
        {nullable(children, () => (
            <Separator />
        ))}
        <FiltersBarItem layout="fill">{children}</FiltersBarItem>
        <FiltersBarItem>
            <PageUserMenu />
        </FiltersBarItem>
    </FiltersBar>
);
