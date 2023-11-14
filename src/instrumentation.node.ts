import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';

const serviceEnvironment = process.env.SERVICE_ENVIRONMENT || 'unknown';
const commitHash = process.env.CI_COMMIT_SHORT_SHA || 'unknown';

const sdk = new NodeSDK({
    resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: `issues-${serviceEnvironment}-${commitHash}`,
        [SemanticResourceAttributes.K8S_POD_NAME]: process.env.HOSTNAME,
        [SemanticResourceAttributes.K8S_CLUSTER_NAME]: process.env.CLUSTER_URL,
    }),
    spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter()),
});
sdk.start();
