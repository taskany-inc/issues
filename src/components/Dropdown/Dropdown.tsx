import {
    Dropdown as DropdownBricks,
    DropdownTrigger as DropdownTriggerBricks,
    DropdownPanel as DropdownPanelBricks,
    Input,
    MenuItem,
    Tooltip,
    Text,
    Dot,
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
    useRef,
    useState,
} from 'react';
import { IconSearchOutline } from '@taskany/icons';
import { KeyCode, ListView, ListViewItem, nullable, useKeyboard } from '@taskany/bricks';
import cn from 'classnames';

import { comboboxInput, comboboxItem } from '../../utils/domObjects';

import s from './Dropdown.module.css';
import { tr, I18nKey } from './Dropdown.i18n';

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
    renderTrigger?: <T>(
        props: Omit<Parameters<NonNullable<DropdownTriggerBricksProps['renderTrigger']>>['0'], 'ref'> & {
            onClick: () => void;
            ref?: MutableRefObject<T>;
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
    const errorRef = useRef<HTMLDivElement | null>(null);
    return (
        <>
            <DropdownTriggerBricks
                label={nullable(label, (l) => tr(l))}
                view={view}
                onClick={toggle}
                className={className}
                error={Boolean(error)}
                renderTrigger={
                    renderTrigger
                        ? ({ ref, ...props }) => renderTrigger<HTMLElement | null>({ ...props, ref, onClick: toggle })
                        : undefined
                }
                {...props}
            >
                <div ref={errorRef}>
                    {nullable(
                        children,
                        () => children,
                        <Text size="s" ellipsis className={cn({ [s.DropdownTriggerLabel_default]: !error })}>
                            {tr('Not chosen')}
                        </Text>,
                    )}
                </div>
            </DropdownTriggerBricks>
            {nullable(error, ({ message }) => (
                <Tooltip view="danger" reference={errorRef} placement="bottom" offset={[0, 16]}>
                    {message}
                </Tooltip>
            ))}
        </>
    );
};

interface DropdownPanelProps<T> extends Omit<ComponentProps<typeof DropdownPanelBricks>, 'onChange'> {
    items?: T[];
    value?: Partial<T>;
    width?: ComponentProps<typeof DropdownPanelBricks>['width'];
    inputState?: string;
    placeholder?: string;
    selectable?: boolean;
    title?: string;
    onChange?: (item: T) => void;
    setInputState?: (value: string) => void;
    renderItem?: (props: Parameters<ComponentProps<typeof ListViewItem>['renderItem']>['0'] & { item: T }) => ReactNode;
}

export const DropdownPanel = <T extends { id: string }>({
    placement = 'top-start',
    offset,
    width,
    inputState,
    placeholder,
    selectable,
    items = [],
    title,
    value,
    children,
    className,
    setInputState,
    onChange,
    renderItem,
    ...props
}: DropdownPanelProps<T>) => {
    const { open, onClose } = useContext(DropdownContext);

    const handleInputChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            setInputState?.(e.target.value);
        },
        [setInputState],
    );

    const handleChange = useCallback(
        (item: T) => {
            onChange?.(item);
        },
        [onChange],
    );

    const [onESC] = useKeyboard([KeyCode.Escape], () => {
        onClose();
    });

    return (
        // The content component instance remains in memory/mounted across open/closes of the popover.
        // https://github.com/atomiks/tippyjs-react/issues/82
        nullable(open, () => (
            <DropdownPanelBricks
                width={width}
                offset={offset}
                placement={placement}
                className={cn(s.DropdownPanel, className)}
                {...(setInputState ? onESC : {})}
                {...props}
            >
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
                {nullable(items.length && title, () => (
                    <Text size="s" weight="bold" className={s.DropdownSuggestionsTitle}>
                        {title}
                    </Text>
                ))}

                <ListView onKeyboardClick={handleChange}>
                    {items.map((item) => (
                        <ListViewItem
                            key={item.id}
                            value={item}
                            renderItem={(props) => (
                                <MenuItem
                                    onClick={() => {
                                        handleChange(item);
                                        onClose();
                                    }}
                                    {...props}
                                    hovered={props.active}
                                    iconLeft={nullable(selectable, () => (
                                        <Dot color={value?.id === item.id ? 'var(--check-checked)' : 'transparent'} />
                                    ))}
                                    {...comboboxItem.attr}
                                >
                                    {renderItem?.({ ...props, item })}
                                </MenuItem>
                            )}
                        />
                    ))}
                </ListView>
            </DropdownPanelBricks>
        ))
    );
};
