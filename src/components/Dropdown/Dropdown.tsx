import {
    ListViewItem,
    Dropdown as DropdownBricks,
    DropdownTrigger as DropdownTriggerBricks,
    DropdownPanel as DropdownPanelBricks,
    DropdownTriggerError as DropdownTriggerErrorBricks,
    Input,
    MenuItem,
    AutoCompleteList,
    AutoComplete,
    Checkbox,
} from '@taskany/bricks/harmony';
import {
    ChangeEvent,
    ComponentProps,
    MutableRefObject,
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { IconSearchOutline } from '@taskany/icons';
import { KeyCode, nullable, useKeyboard } from '@taskany/bricks';
import cn from 'classnames';

import { comboboxInput, comboboxItem } from '../../utils/domObjects';

import { tr, I18nKey } from './Dropdown.i18n';
import s from './Dropdow.module.css';

interface DropdownContextProps {
    open?: boolean;
    toggle: () => void;
    onClose: () => void;
}

const DropdownContext = createContext<DropdownContextProps>({ open: false, toggle: () => {}, onClose: () => {} });

export const Dropdown = ({ children, isOpen, onClose, ...props }: ComponentProps<typeof DropdownBricks>) => {
    const [open, setOpen] = useState(isOpen);

    const toggle = useCallback(() => {
        setOpen((prev) => !prev);
    }, []);

    const onClosePanel = useCallback(() => {
        setOpen(false);
        onClose?.();
    }, [onClose]);

    useEffect(() => {
        setOpen(isOpen);
    }, [isOpen]);

    return (
        <DropdownContext.Provider value={{ open, toggle, onClose: onClosePanel }}>
            <DropdownBricks isOpen={open} onClose={onClosePanel} {...props}>
                {children}
            </DropdownBricks>
        </DropdownContext.Provider>
    );
};

type DropdownTriggerBricksProps = ComponentProps<typeof DropdownTriggerBricks>;

interface DropdownTriggerProps extends Omit<DropdownTriggerBricksProps, 'error' | 'renderTrigger'> {
    error?: { message?: string };
    label?: Exclude<I18nKey, 'not chosen'>;
    className?: string;
    renderTrigger?: (
        props: Omit<Parameters<NonNullable<DropdownTriggerBricksProps['renderTrigger']>>['0'], 'ref'> & {
            onClick: () => void;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref?: MutableRefObject<any>;
        },
    ) => ReactNode;
}

export const DropdownTrigger = ({
    label,
    children,
    className,
    error,
    view = 'fill',
    renderTrigger,
    ...props
}: DropdownTriggerProps) => {
    const { toggle } = useContext(DropdownContext);
    return (
        <>
            <DropdownTriggerBricks
                label={nullable(label, (l) => tr(l))}
                view={view}
                onClick={toggle}
                className={cn(s.DropdownTrigger, className)}
                error={Boolean(error)}
                renderTrigger={
                    renderTrigger ? ({ ref, ...props }) => renderTrigger({ ...props, ref, onClick: toggle }) : undefined
                }
                placeholder={tr('Not chosen')}
                {...props}
            >
                {children}
            </DropdownTriggerBricks>
            {nullable(error, ({ message }) => (
                <DropdownTriggerErrorBricks message={message} />
            ))}
        </>
    );
};

interface DropdownPanelProps<T, V> extends Omit<ComponentProps<typeof DropdownPanelBricks>, 'onChange'> {
    items?: T[];
    value?: T[];
    width?: ComponentProps<typeof DropdownPanelBricks>['width'];
    iconLeft?: ComponentProps<typeof MenuItem>['iconLeft'];
    inputState?: string;
    placeholder?: string;
    selectable?: boolean;
    title?: string;
    mode?: V;
    onChange?: V extends 'single' ? (item: T) => void : (items: T[]) => void;
    setInputState?: (value: string) => void;
    renderItem?: (props: Parameters<ComponentProps<typeof ListViewItem>['renderItem']>['0'] & { item: T }) => ReactNode;
}

/**
 * The definition DropdownGuardedProps<T> defines a type that includes `onChange` & `mode` props.
 * If the mode property is `single`, the onChange method should accept a single value of type T.
 * If the mode property is `multiple`, the onChange method should accept an array of values of type T.
 */
export type DropdownGuardedProps<T> =
    | { mode: 'single'; onChange?: (value: T) => void }
    | { mode: 'multiple'; onChange?: (value: T[]) => void };

function singleGuard<T>(props: Record<string, unknown>): props is {
    mode: 'single';
    onChange?: (items: T) => void;
} {
    return props?.mode !== 'multiple';
}

function multipleGuard<T>(props: Record<string, unknown>): props is {
    mode: 'multiple';
    onChange?: (items: T[]) => void;
} {
    return props?.mode === 'multiple';
}

export const DropdownPanel = <T extends { id: string }, V extends ComponentProps<typeof AutoComplete>['mode']>({
    placement = 'top-start',
    inputState,
    placeholder,
    selectable,
    items = [],
    title,
    value,
    children,
    iconLeft,
    setInputState,
    renderItem,
    ...props
}: DropdownPanelProps<T, V>) => {
    const { open, onClose } = useContext(DropdownContext);

    const handleInputChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            setInputState?.(e.target.value);
        },
        [setInputState],
    );

    const valueMap = useMemo(
        () => (value || []).reduce<Record<string, boolean>>((acc, cur) => ({ ...acc, [cur.id]: true }), {}),
        [value],
    );
    const multiple = props.mode === 'multiple';

    const [onESC] = useKeyboard([KeyCode.Escape], () => {
        onClose();
    });

    const handleChange = useCallback(
        (items: T[]) => {
            if (multipleGuard<T>(props)) {
                props.onChange?.(items);
                return;
            }
            if (singleGuard<T>(props)) {
                props.onChange?.(items[0]);
            }
        },
        [props],
    );

    const { onChange: _, ...rest } = props;

    return (
        // The content component instance remains in memory/mounted across open/closes of the popover.
        // https://github.com/atomiks/tippyjs-react/issues/82
        nullable(open, () => (
            <DropdownPanelBricks placement={placement} {...(setInputState ? onESC : {})} {...rest}>
                {children}
                {nullable(Boolean(setInputState), () => (
                    <>
                        <Input
                            placeholder={placeholder}
                            outline
                            value={inputState}
                            autoFocus
                            onChange={handleInputChange}
                            iconLeft={<IconSearchOutline size="s" />}
                            {...comboboxInput.attr}
                        />
                    </>
                ))}

                <AutoComplete
                    items={items}
                    mode={props.mode}
                    onChange={handleChange}
                    value={value}
                    renderItem={({ item, isSelected, active, onChange, ...props }) => (
                        <MenuItem
                            onClick={() => {
                                onChange();
                                if (multiple) return;
                                onClose?.();
                            }}
                            {...props}
                            multiple={multiple}
                            hovered={active}
                            selected={valueMap[item.id]}
                            selectable={selectable}
                            iconLeft={nullable(selectable, () => {
                                return iconLeft || (multiple && <Checkbox id={item.id} defaultChecked={isSelected} />);
                            })}
                            {...comboboxItem.attr}
                        >
                            {renderItem?.({ ...props, item })}
                        </MenuItem>
                    )}
                >
                    {nullable(
                        multiple,
                        () => (
                            <>
                                <AutoCompleteList selected />
                                <AutoCompleteList title={title} filterSelected />
                            </>
                        ),
                        <AutoCompleteList title={title} />,
                    )}
                </AutoComplete>
            </DropdownPanelBricks>
        ))
    );
};
