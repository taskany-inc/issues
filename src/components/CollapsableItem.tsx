import { FC, ReactNode } from 'react';
import styled from 'styled-components';
import { gray7 } from '@taskany/colors';

export const collapseOffset = 20;

const dotSize = 8;

const line = `
    position: absolute;
    width: 1px;
    top: 0;
    bottom: 0;
    left: ${-collapseOffset / 2}px;
    background: ${gray7};
    z-index: 1;
`;

const StyledDot = styled.div`
    position: absolute;
    top: 50%;
    width: ${dotSize}px;
    height: ${dotSize}px;
    margin-top: -${dotSize / 2}px;
    left: ${-collapseOffset / 2 - dotSize / 2}px;

    border-radius: 100%;
    background: ${gray7};
`;

const StyledParentDot = styled(StyledDot)`
    left: ${-1.5 * collapseOffset - dotSize / 2}px;
`;

type BorderType = 'hidden' | 'top' | 'center' | 'bottom';

const getBorderType = (nodeType: NodePosition, collapsed: boolean, hasChilds: boolean): BorderType => {
    if (nodeType === 'root' && (collapsed || !hasChilds)) {
        return 'hidden';
    }

    if (!collapsed && hasChilds) {
        return 'top';
    }

    if (nodeType === 'last-child') {
        return 'bottom';
    }

    return 'center';
};

const CollapsableItemContent = styled.div<{
    border: BorderType;
}>`
    position: relative;
    padding-bottom: 1px;

    &:after {
        content: '';
        ${line};
        ${({ border }) => {
            if (border === 'hidden') {
                return `
                    display: none;
                `;
            }

            if (border === 'top') {
                return `
                    top: 50%;
                `;
            }

            if (border === 'bottom') {
                return `
                    bottom: 50%;
                `;
            }
        }}
    }
`;

const CollapsableItemContainer = styled.div<{ isSubTree: boolean; subTreeBorder: 'center' | 'hidden' }>`
    position: relative;
    margin-left: -${collapseOffset}px;
    padding-left: ${collapseOffset}px;

    &:after {
        display: none;
        content: '';
        ${line}
        left: ${-collapseOffset / 2}px;
    }

    ${({ isSubTree, subTreeBorder }) =>
        isSubTree &&
        `   
            margin-left: 0px;

            &:after {
                ${subTreeBorder !== 'hidden' && 'display: block;'};
            }

            > ${CollapsableItemContent}:first-child:before {
                content: '';
                ${line};
                bottom: 50%;
                left: ${-1.5 * collapseOffset}px;
            }
        `}
`;

type NodePosition = 'root' | 'first-child' | 'last-child' | 'default';

export const getNodePosition = (index: number, max: number): NodePosition => {
    if (index === max) return 'last-child';
    if (index === 0) return 'first-child';

    return 'default';
};

export const CollapsableItem: FC<{
    children?: ReactNode;
    position?: NodePosition;
    nodes?: ReactNode[];
    collapsed: boolean;
    header: ReactNode;
    onClick?: () => void;
}> = ({ children = [], collapsed, header, nodes = [], onClick, position = 'root' }) => {
    const border = getBorderType(position, collapsed, !!nodes.length);
    const isSubTree = position !== 'root' && border === 'top';

    // CollapsableItemContent for children block has NO border if there are no other childs below
    const contentBorder = (position === 'last-child' || position === 'root') && !nodes?.length ? 'hidden' : 'center';

    return (
        <CollapsableItemContainer isSubTree={isSubTree} subTreeBorder={position === 'last-child' ? 'hidden' : 'center'}>
            <CollapsableItemContent onClick={onClick} border={border}>
                {border !== 'hidden' && <StyledDot />}
                {isSubTree && <StyledParentDot />}
                {header}
            </CollapsableItemContent>
            {!collapsed ? (
                <>
                    <CollapsableItemContent border={contentBorder}>{children}</CollapsableItemContent>
                    {nodes}
                </>
            ) : null}
        </CollapsableItemContainer>
    );
};
