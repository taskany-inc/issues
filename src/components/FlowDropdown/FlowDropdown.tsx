import React, { ComponentProps, useCallback, useMemo, useState } from 'react';

import { trpc } from '../../utils/trpcClient';
import { Dropdown, DropdownTrigger, DropdownPanel, DropdownGuardedProps } from '../Dropdown/Dropdown';

import { tr } from './FlowDropdown.i18n';

interface DropdownFlowValue {
    id: string;
    title?: string;
}

type FlowDropdownProps = {
    error?: ComponentProps<typeof DropdownTrigger>['error'];
    label?: ComponentProps<typeof DropdownTrigger>['label'];
    view?: ComponentProps<typeof DropdownTrigger>['view'];
    renderTrigger?: ComponentProps<typeof DropdownTrigger>['renderTrigger'];
    className?: string;
    query?: string;
    value?: DropdownFlowValue | DropdownFlowValue[];
    disabled?: boolean;
    readOnly?: boolean;
    placeholder?: string;
    placement?: ComponentProps<typeof DropdownPanel>['placement'];
    onClose?: () => void;
} & DropdownGuardedProps<DropdownFlowValue>;

export const FlowDropdown = ({
    query = '',
    value,
    mode,
    placeholder,
    placement,
    onChange,
    onClose,
    ...props
}: FlowDropdownProps) => {
    const [inputState, setInputState] = useState(query);

    const { data: suggestions = [] } = trpc.flow.suggestions.useQuery(inputState, {
        select(data) {
            return data.map<DropdownFlowValue>(({ id, title }) => ({ id, title }));
        },
    });

    const handleClose = useCallback(() => {
        onClose?.();
        setInputState('');
    }, [onClose]);

    const values = useMemo(() => {
        const res: DropdownFlowValue[] = [];
        return res.concat(value || []);
    }, [value]);

    return (
        <Dropdown arrow onClose={handleClose}>
            <DropdownTrigger {...props}>{values[0]?.title}</DropdownTrigger>
            <DropdownPanel
                width={320}
                title={tr('Suggestions')}
                value={values}
                items={suggestions}
                inputState={inputState}
                selectable
                placeholder={placeholder}
                setInputState={setInputState}
                mode={mode}
                placement={placement}
                onChange={onChange}
                renderItem={({ item }) => item.title}
            />
        </Dropdown>
    );
};
