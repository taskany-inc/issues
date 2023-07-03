import { Button } from '@taskany/bricks';
import { gapS, gapSm, gray4, radiusM } from '@taskany/colors';
import {
    ComponentProps,
    FC,
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import styled from 'styled-components';

type TemplateId = string;
type TemplateValue = number | 'auto' | 'grow';
type Template = TemplateValue[];

type RowId = string;
type RowValue = Array<number | undefined>;
type Row = {
    id: RowId;
    templateId: TemplateId;
    template: Template;
    value: RowValue;
};

type destroyFn = () => void;
type TableContext = {
    initRow: (row: Row) => destroyFn;
    updateRow: (row: Row, values: RowValue) => void;
    getRow: (row: Row) => RowValue;
};

const createRowId = (() => {
    let id = 0;

    return () => String(id++);
})();

const createTemplateId = (template: Template) => String(template);

const createRow = (template: Template): Row => ({
    id: createRowId(),
    template,
    templateId: createTemplateId(template),
    value: template.map(() => undefined),
});

const defaultContext = {
    initRow: () => () => {},
    updateRow: () => {},
    getRow: () => [],
};

const TableContext = createContext<TableContext>(defaultContext);

export const TableCountable: FC<{
    children?: ReactNode;
}> = ({ children }) => {
    const [templates, setTemplate] = useState<Record<TemplateId, Record<RowId, RowValue>>>({});

    const initRow = useCallback((row: Row) => {
        setTemplate((old) => ({
            ...old,
            [row.templateId]: {
                ...old[row.templateId],
                [row.id]: row.value,
            },
        }));

        return () => {
            setTemplate((old) => {
                delete old[row.templateId][row.id];

                if (!Object.values(old[row.templateId]).length) {
                    delete old[row.templateId];

                    return {
                        ...old,
                    };
                }

                return {
                    ...old,
                    [row.templateId]: {
                        ...old[row.templateId],
                    },
                };
            });
        };
    }, []);

    const updateRow = useCallback((row: Row, value: RowValue) => {
        setTemplate((old) => {
            if (old[row.templateId]) {
                return {
                    ...old,
                    [row.templateId]: {
                        ...old[row.templateId],
                        [row.id]: value,
                    },
                };
            }

            return old;
        });
    }, []);

    const rows: Record<TemplateId, RowValue> = useMemo(
        () =>
            Object.keys(templates).reduce((acum, templateId) => {
                const template = templates[templateId];
                const rows = Object.values(template);

                const valuesRow = rows[0].reduce((acum, _, i) => {
                    const max = rows.reduce((acum, row) => {
                        const column = row[i];
                        if (column) {
                            return Math.max(acum ?? 0, column);
                        }
                        return acum;
                    }, undefined as undefined | number);

                    acum[i] = max;

                    return acum;
                }, [] as RowValue);

                acum[templateId] = valuesRow;

                return acum;
            }, {} as Record<TemplateId, RowValue>),
        [templates],
    );

    const getRow = useCallback((row: Row) => (rows[row.templateId] ? rows[row.templateId] : row.value), [rows]);

    const value = useMemo(
        () => ({
            getRow,
            initRow,
            updateRow,
        }),
        [initRow, updateRow, getRow],
    );

    return <TableContext.Provider value={value}>{children}</TableContext.Provider>;
};

const CellContainer = styled.div<{ value: ComponentProps<typeof Cell>['width'] }>`
    ${({ value }) => {
        if (typeof value === 'number') {
            return `width: ${value}px;`;
        }
        if (!value) {
            return 'width: auto;';
        }
        return 'flex: 1;';
    }}
`;

const Cell: FC<{
    children?: ReactNode;
    initCell: (width: number) => void;
    width?: Omit<TemplateValue, 'auto'>;
}> = ({ children, initCell, width }) => {
    const elemRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (elemRef.current) {
            return initCell(elemRef.current.offsetWidth);
        }
    });

    useEffect(() => {
        // to do
    }, [children]);

    return (
        <CellContainer value={width} ref={elemRef}>
            {children}
        </CellContainer>
    );
};

const RowContainer = styled.div`
    padding: ${gapS} ${gapSm};
    border-radius: ${radiusM};
    cursor: pointer;

    display: flex;

    &:hover {
        background-color: ${gray4};
    }
`;

export const Row: FC<{
    children?: ReactNode;
    template: Template;
    columns: ReactNode[];
}> = ({ template, columns }) => {
    const { initRow, updateRow, getRow } = useContext(TableContext);
    const [row] = useState(createRow(template));
    const [value, setValue] = useState<RowValue>(() => row.template.map(() => undefined));

    useEffect(() => {
        return initRow(row);
    }, [row, initRow]);

    const initCell = useCallback(
        (index: number, width: number) => {
            if (value[index] !== width) {
                const newValue = [...value];

                newValue[index] = width;

                setValue([...newValue]);

                updateRow(row, newValue);
            }

            return () => {
                // TODO: how to update cell if content changed?
                // const newValue = [...value];
                // newValue[index] = undefined;
                // setValue(newValue);
            };
        },
        [value, row],
    );

    useEffect(() => {
        console.log('QQQ Columns Update');
        // way to force memo in columns
    }, columns);

    const counted = getRow(row);

    return (
        <RowContainer>
            {columns.map((column, i) => {
                if (i >= template.length) {
                    return null;
                }

                const t = template[i];

                // we need to wait for initialization, if have undefined as local value

                const countedWidth = value[i] ? counted[i] : undefined;
                const width = t === 'auto' ? countedWidth : t;

                return (
                    <Cell key={i} initCell={(width) => initCell(i, width)} width={width}>
                        {column}
                    </Cell>
                );
            })}
        </RowContainer>
    );
};

/** Example of usage */

const TableItem = styled.div<{ align?: 'left' | 'right' | 'center' }>`
    padding: 0 10px;
    white-space: nowrap;
    border: 1px ${gray4} solid;

    text-align: ${({ align = 'left' }) => align};
`;

const ButtonContainer = styled.div`
    text-align: center;
    margin-bottom: 10px;
`;

const templateA: Template = [300, 'auto', 'auto', 'grow'];
const templateB: Template = ['auto', 'grow', 'auto', 'auto'];

export const Example = () => {
    const [toggle, setToggle] = useState(false);

    return (
        <TableCountable>
            <ButtonContainer>
                <Button text={'Toggle layout'} onClick={() => setToggle((v) => !v)} />
            </ButtonContainer>
            <Row
                template={templateA}
                columns={[
                    <TableItem key={1}>Template A</TableItem>,
                    <TableItem key={2}>Value 1</TableItem>,
                    <TableItem key={3}>f</TableItem>,
                    <TableItem key={4}>erererererer</TableItem>,
                ]}
            />
            {toggle && (
                <Row
                    template={templateA}
                    columns={[
                        <TableItem key={1}>Template A</TableItem>,
                        <TableItem key={2}>Value 112 Value 112</TableItem>,
                        <TableItem key={3}>Fooo Baar</TableItem>,
                        <TableItem key={4}>erererererer</TableItem>,
                    ]}
                />
            )}

            <Row
                template={templateA}
                columns={[
                    <TableItem key={1}>Template A</TableItem>,
                    <TableItem key={2}>Value 1</TableItem>,
                    <TableItem key={3}>f</TableItem>,
                    <TableItem key={4}>erererererer</TableItem>,
                ]}
            />

            <Row
                template={templateB}
                columns={[
                    <TableItem key={1}>First Item</TableItem>,
                    <TableItem key={2} align="center">
                        Other Template
                    </TableItem>,
                    <TableItem key={3}>gg</TableItem>,
                    <TableItem key={4}>f</TableItem>,
                ]}
            />

            <Row
                template={templateB}
                columns={[
                    <TableItem key={1}>2 Item</TableItem>,
                    <TableItem key={2} align="center">
                        Other Template
                    </TableItem>,
                    <TableItem key={3}>dd</TableItem>,
                    <TableItem key={4}>f</TableItem>,
                ]}
            />

            <Row
                template={templateB}
                columns={[
                    <TableItem key={1}>3 Item</TableItem>,
                    <TableItem key={2} align="center">
                        Other Template
                    </TableItem>,
                    <TableItem key={3}>bb</TableItem>,
                    <TableItem key={4}>f</TableItem>,
                ]}
            />
            <Row
                template={templateA}
                columns={[
                    <TableItem key={1}>Template A</TableItem>,
                    <TableItem key={2}>Value 1</TableItem>,
                    <TableItem key={3}>f</TableItem>,
                    <TableItem key={4}>erererererer</TableItem>,
                ]}
            />
            <Row
                template={templateA}
                columns={[
                    <TableItem key={1}>Template A</TableItem>,
                    <TableItem key={2}>Value 1</TableItem>,
                    <TableItem key={3}>f</TableItem>,
                    <TableItem key={4}>erererererer</TableItem>,
                ]}
            />
        </TableCountable>
    );
};
