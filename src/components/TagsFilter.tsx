import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Tag as TagModel } from '../../graphql/@generated/genql';
import { useKeyPress } from '../hooks/useKeyPress';
import { useKeyboard, KeyCode } from '../hooks/useKeyboard';
import { nullable } from '../utils/nullable';

import { Button } from './Button';
import { Popup } from './Popup';
import { FiltersMenuItem } from './FiltersMenuItem';
import { Tag } from './Tag';

interface TagsFilterProps {
    disabled?: React.ComponentProps<typeof Button>['disabled'];
    text: string;
    tags?: Array<TagModel | undefined>;

    onClick?: (selected: string[]) => void;
}

export const TagsFilter: React.FC<TagsFilterProps> = ({ text, tags, disabled, onClick }) => {
    const popupRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [popupVisible, setPopupVisibility] = useState(false);
    const downPress = useKeyPress('ArrowDown');
    const upPress = useKeyPress('ArrowUp');
    const [cursor, setCursor] = useState<number>();
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const onClickOutside = useCallback(() => {
        setPopupVisibility(false);
    }, []);

    const onButtonClick = useCallback(() => {
        setPopupVisibility(!popupVisible);
    }, [popupVisible]);

    const onItemClick = useCallback(
        (t?: TagModel) => () => {
            selected.has(t!.id) ? selected.delete(t!.id) : selected.add(t!.id);
            setSelected(new Set(selected));

            onClick && onClick(Array.from(selected));
        },
        [onClick, selected],
    );

    const [onESC] = useKeyboard([KeyCode.Escape], () => popupVisible && setPopupVisibility(false));

    const [onENTER] = useKeyboard([KeyCode.Enter], () => {
        if (tags?.length && cursor) {
            onItemClick(tags[cursor])();
            setPopupVisibility(false);
        }
    });

    useEffect(() => {
        if (tags?.length && downPress) {
            setCursor((prevState = 0) => (prevState < tags.length - 1 ? prevState + 1 : prevState));
        }
    }, [tags, downPress]);

    useEffect(() => {
        if (tags?.length && upPress) {
            setCursor((prevState = 0) => (prevState > 0 ? prevState - 1 : prevState));
        }
    }, [tags, upPress]);

    return (
        <>
            <span ref={popupRef} {...onESC} {...onENTER}>
                <FiltersMenuItem
                    ref={buttonRef}
                    onClick={onButtonClick}
                    disabled={disabled}
                    active={Boolean(Array.from(selected).length)}
                >
                    {text}
                </FiltersMenuItem>
            </span>

            <Popup
                placement="top-start"
                visible={popupVisible && Boolean(tags?.length)}
                onClickOutside={onClickOutside}
                reference={popupRef}
                interactive
                minWidth={150}
                maxWidth={250}
                offset={[0, 4]}
            >
                <>
                    {tags?.map((t) =>
                        nullable(t, (tag) => (
                            <Tag
                                key={tag.id}
                                title={tag.title}
                                checked={selected.has(tag.id)}
                                onClick={onItemClick(tag)}
                            />
                        )),
                    )}
                </>
            </Popup>
        </>
    );
};
