import * as Sentry from '@sentry/nextjs';
import type { NextApiRequest, NextPage } from 'next';
import type { ErrorProps } from 'next/error';
import NextErrorComponent from 'next/error';

import { Logger } from '../utils/logger';

const CustomErrorComponent: NextPage<ErrorProps> = (props) => <NextErrorComponent statusCode={props.statusCode} />;
const logger = new Logger('_error');

CustomErrorComponent.getInitialProps = async (contextData) => {
    await Sentry.captureUnderscoreErrorException(contextData);

    const { err, req } = contextData;

    if (err) {
        logger.error(err, req as NextApiRequest);
    }

    return NextErrorComponent.getInitialProps(contextData);
};

export default CustomErrorComponent;
