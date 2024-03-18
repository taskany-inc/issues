import { nullable } from '@taskany/bricks';

import { pageHeader, pageTitle } from '../utils/domObjects';

import { FiltersBar, FiltersBarItem, FiltersBarTitle } from './FiltersBar/FiltersBar';
import { Separator } from './Separator/Separator';

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
        {nullable(children, (ch) => (
            <>
                <Separator />
                <FiltersBarItem layout="fill">{ch}</FiltersBarItem>
            </>
        ))}
    </FiltersBar>
);
