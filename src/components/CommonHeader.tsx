import { nullable } from '@taskany/bricks';

import { pageHeader, pageTitle } from '../utils/domObjects';

import { FiltersBar, FiltersBarItem, FiltersBarTitle } from './FiltersBar/FiltersBar';
import { GlobalSearch } from './GlobalSearch/GlobalSearch';
import { Separator } from './Separator/Separator';
import { PageUserMenu } from './PageUserMenu';

interface CommonHeaderProps {
    title?: React.ReactNode;
    children?: React.ReactNode;
}
export const CommonHeader: React.FC<CommonHeaderProps> = ({ title, children }) => (
    <FiltersBar {...pageHeader.attr}>
        {nullable(title, (t) => (
            <FiltersBarItem>
                <FiltersBarTitle {...pageTitle.attr}>{t}</FiltersBarTitle>
            </FiltersBarItem>
        ))}
        {nullable(children, () => (
            <Separator />
        ))}
        <FiltersBarItem layout="fill">{children}</FiltersBarItem>
        <FiltersBarItem>
            <GlobalSearch />
        </FiltersBarItem>
        <FiltersBarItem>
            <PageUserMenu />
        </FiltersBarItem>
    </FiltersBar>
);
