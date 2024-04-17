import { FC, ReactNode, useCallback, useMemo } from 'react';
import { Keyboard } from '@taskany/bricks';
import { IconBulbOnOutline } from '@taskany/icons';
import { Tip } from '@taskany/bricks/harmony';

import { I18nKey, tr } from './RotatableTip.i18n';
import s from './RotatableTip.module.css';

type TipContext = 'project' | 'goal' | 'settings' | 'invites';
interface RotatableTipProps {
    context?: TipContext;
}

const RotatableTip: FC<RotatableTipProps> = ({ context }) => {
    const generateTip = useCallback((key: I18nKey, options?: { ctx?: TipContext } & Record<string, ReactNode>) => {
        return tr.raw(key, {
            key: <Keyboard key="command/enter" command enter />,
            entity: options?.ctx ? tr(options.ctx) : '',
            ...options,
        });
    }, []);

    const tips: ((ctx?: TipContext) => ReactNode)[] = useMemo(() => {
        return [
            () =>
                generateTip('Hold {key} to see available hotkeys', {
                    key: <Keyboard key="h">h</Keyboard>,
                }),
        ];
    }, [generateTip]);

    const contextTips: Record<TipContext, ((ctx?: TipContext) => ReactNode)[]> = useMemo(() => {
        return {
            goal: [(ctx) => generateTip('Press {key} to save {entity}', { ctx })],
            project: [(ctx) => generateTip('Press {key} to save {entity}', { ctx })],
            settings: [(ctx) => generateTip('Press {key} to save {entity}', { ctx })],
            invites: [(ctx) => generateTip('Press {key} to send {entity}', { ctx })],
        };
    }, [generateTip]);

    const allTips = useMemo(() => {
        return [...tips, ...(context ? contextTips[context] : [])];
    }, [context, contextTips, tips]);

    const randomIndex = useMemo(() => Math.floor(Math.random() * allTips.length), [allTips.length]);

    return (
        <Tip title={tr('Pro tip!')} icon={<IconBulbOnOutline size="s" className={s.TipIcon} />}>
            {allTips[randomIndex](context)}
        </Tip>
    );
};

export default RotatableTip;
