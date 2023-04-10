import React, { useState } from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { ComboBox } from '@taskany/bricks';

export default {
    title: 'Taskany/ComboBox',
    component: ComboBox,
    args: {},
} as ComponentMeta<typeof ComboBox>;

const Test = () => {
    const items = ['one', 'two'];
    const [text, setText] = useState('Open');
    const [value, setValue] = useState('');
    // const [visible, setVisible] = useState(false);

    return (
        <div style={{ width: '200px' }}>
            <ComboBox
                // visible={visible}
                text={text}
                value={value}
                items={items}
                onChange={(v) => {
                    setValue(v as string);
                    setText(v as string);
                    // setVisible(false);
                }}
                renderTrigger={(props) => (
                    <button ref={props.ref} onClick={props.onClick}>
                        {props.text}
                    </button>
                )}
                renderInput={(props) => (
                    <input
                        {...props}
                        onChange={(e) => {
                            setValue(e.currentTarget.value);
                            // setVisible(true);
                        }}
                    />
                )}
                renderItem={(props) => (
                    <div
                        tabIndex={0}
                        key={props.item as string}
                        onClick={props.onClick}
                        style={
                            props.cursor === props.index
                                ? {
                                      border: '1px solid red',
                                  }
                                : {}
                        }
                    >
                        {props.item as string}
                    </div>
                )}
            />
        </div>
    );
};

const TestTmp: ComponentStory<typeof ComboBox> = () => <Test />;

export const Default = TestTmp.bind({});
