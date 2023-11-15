import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';

if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    const sdk = new NodeSDK({
        resource: new Resource({
            [SemanticResourceAttributes.SERVICE_NAME]:
                process.env.TASKANY_OPEN_TELEMETRY_SERVICE_NAME || 'taskany-issues',
            [SemanticResourceAttributes.SERVICE_VERSION]: process.env.SERVICE_VERSION,
            [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.DEPLOYMENT_ENVIRONMENT,
            [SemanticResourceAttributes.K8S_POD_NAME]: process.env.HOSTNAME,
            [SemanticResourceAttributes.K8S_CLUSTER_NAME]: process.env.CLUSTER_URL,
        }),
        spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter()),
    });

    sdk.start();
}
