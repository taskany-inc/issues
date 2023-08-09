import { FC, ReactNode, createContext, useContext } from 'react';
import styled, { css } from 'styled-components';
import { gray7 } from '@taskany/colors';

export const collapseOffset = 20;

const dotSize = 8;

const line = css`
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

const CollapsableItemContainer = styled.div<{ isSubTree: boolean }>`
    position: relative;
    margin-left: -${collapseOffset}px;
    padding-left: ${collapseOffset}px;

    &:after {
        display: none;
        content: '';
        ${line}
        left: ${-collapseOffset / 2}px;
    }

    ${({ isSubTree }) =>
        isSubTree &&
        `   
            margin-left: 0px;

            &:after {
                display: block;
            }
        `}
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

type NodePosition = 'root' | 'first-child' | 'last-child' | 'default';

const getNodePosition = (index: number, max: number): NodePosition => {
    if (index === max) return 'last-child';
    if (index === 0) return 'first-child';

    return 'default';
};

const collapsableItemRenderContext = createContext<{
    position: NodePosition;
}>({
    position: 'root',
});

export const CollapsableItem: FC<{
    children?: ReactNode;
    nodes?: ReactNode[];
    collapsed: boolean;
    header: ReactNode;
    onClick?: () => void;
}> = ({ children = [], collapsed, header, nodes = [], onClick }) => {
    const { position } = useContext(collapsableItemRenderContext);

    const hasChilds = !!nodes.length;

    const border = getBorderType(position, collapsed, hasChilds);
    const isSubTree = position !== 'root' && border === 'top';

    // CollapsableItemContent for children block has NO border if there are no other childs below
    const contentBorder = (position === 'last-child' || position === 'root') && !hasChilds ? 'hidden' : 'center';

    return (
        <CollapsableItemContainer isSubTree={isSubTree}>
            <CollapsableItemContent onClick={onClick} border={border}>
                {border !== 'hidden' && <StyledDot />}
                {isSubTree && <StyledParentDot />}
                {header}
            </CollapsableItemContent>
            {!collapsed ? (
                <collapsableItemRenderContext.Provider value={{ position: 'root' }}>
                    <CollapsableItemContent border={contentBorder}>{children}</CollapsableItemContent>
                </collapsableItemRenderContext.Provider>
            ) : null}
            {!collapsed
                ? nodes.map((n, i) => (
                      <collapsableItemRenderContext.Provider
                          key={i}
                          value={{ position: getNodePosition(i, nodes.length - 1) }}
                      >
                          {n}
                      </collapsableItemRenderContext.Provider>
                  ))
                : null}
        </CollapsableItemContainer>
    );
};
