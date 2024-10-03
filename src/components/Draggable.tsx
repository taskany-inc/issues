import {
    createContext,
    FC,
    HTMLAttributes,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

interface DraggableContext {
    registerContainer: <T extends HTMLElement>(elem: T) => () => void;
}

const draggableContext = createContext<DraggableContext>({
    registerContainer: () => () => {},
});

export const DraggableContext: FC<{
    children: ReactNode;
    onDrop: (el: Element, target: Element, source: Element, sibling: Element) => void;
}> = ({ children, onDrop }) => {
    const [containers, setContainers] = useState<HTMLElement[]>([]);

    const registerContainer = useCallback(<T extends HTMLElement>(node: T) => {
        setContainers((old) => {
            return [node, ...old];
        });

        return () => {
            setContainers((old) => {
                old.splice(old.indexOf(node), 1);

                return [...old];
            });
        };
    }, []);

    useEffect(() => {
        const drakePromise = import('dragula').then((dragula) => {
            const drake = dragula.default(containers, {
                direction: 'horizontal',
            });

            drake.on('drop', onDrop);

            return drake;
        });

        return () => {
            drakePromise.then((drake) => drake.destroy());
        };
    }, [containers, onDrop]);

    const value = useMemo(
        () => ({
            registerContainer,
        }),
        [registerContainer],
    );

    return <draggableContext.Provider value={value}>{children}</draggableContext.Provider>;
};

export const Draggable: FC<HTMLAttributes<HTMLDivElement>> = (props) => {
    const ref = useRef<HTMLDivElement>(null);

    const { registerContainer } = useContext(draggableContext);

    useEffect(() => {
        if (ref.current) {
            return registerContainer(ref.current);
        }
    }, [registerContainer]);

    return <div ref={ref} {...props}></div>;
};
