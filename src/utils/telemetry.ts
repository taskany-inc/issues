import { useRouter } from 'next/router';
import { useEffect } from 'react';

export const getTelemetryInstanceSingleton = async () => {
    if (process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT) {
        const { WebTelemetryMonitoringWeb } = await import(
            '@salutejs/web-telemetry/lib/presets/WebTelemetryMonitoringWeb'
        );

        const telemetry = WebTelemetryMonitoringWeb.Instance({
            endpoint: process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT,
            projectName: 'goals',
            debug: process.env.NODE_ENV === 'development',
        });

        return telemetry;
    }
};

let reactRenderStart: number;

if (typeof window !== 'undefined') {
    reactRenderStart = Math.round(performance.now());
}

let isFMPSent = false;
let isWaitingFMP = false;

const sendFMP = (fmp: number, page: string) => {
    getTelemetryInstanceSingleton().then((telemetry) => {
        if (telemetry === undefined) {
            return;
        }

        isFMPSent = true;
        telemetry.webApp.setMetric('FMP', fmp);
        telemetry.webApp.setMetric('page', page);
        telemetry.webApp.send();
    });
};

export const useWebTelemetryMonitoringInit = () => {
    const { pathname } = useRouter();

    useEffect(() => {
        const reactRenderEnd = Math.round(performance.now());

        getTelemetryInstanceSingleton().then((telemetry) => {
            if (telemetry === undefined) {
                return;
            }

            telemetry.startMonitoring();
            telemetry.webApp.setMetric('appVersion', process.env.NEXT_PUBLIC_RELEASE || 'localdev');
            telemetry.webApp.setMetric('reactRenderStart', reactRenderStart);
            telemetry.webApp.setMetric('reactRenderEnd', reactRenderEnd);
        });
    }, []);

    useEffect(() => {
        if (isFMPSent || isWaitingFMP) {
            return;
        }

        const fmp = Math.round(performance.now());
        /**
         * Send FMP if page component didn't send FMP.
         * We call useWebTelemetryMonitoringInit in _app.
         * Children's useEffect is always called before parent's useEffect,
         * so isWaitingFMP will be true, if we call useFMPMetric in page component.
         **/
        sendFMP(fmp, pathname);
    }, [pathname]);
};

export const useFMPMetric = (isLoaded = true) => {
    const { pathname } = useRouter();
    isWaitingFMP = true;

    useEffect(() => {
        if (isFMPSent || !isLoaded) {
            return;
        }

        const fmp = Math.round(performance.now());
        sendFMP(fmp, pathname);
    }, [pathname, isLoaded]);
};
