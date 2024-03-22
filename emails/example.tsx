import { Html, Head } from '@react-email/components';

import { Layout } from './_components/Layout';
import { Header } from './_components/Header';
import { Typography } from './_components/Typography';
import { Space } from './_components/Space';
import { Tooltip } from './_components/Tooltip';
import { Comment } from './_components/Comment';
import { ButtonLink } from './_components/ButtonLink';

interface ExampleProps {
    logoUrl: string;
    title: string;
    baseUrl: string;
}

interface ExampleComponent extends React.FC<ExampleProps> {
    PreviewProps: ExampleProps;
}

const Example: ExampleComponent = ({ logoUrl, title, baseUrl }) => {
    return (
        <Html>
            <Head>
                <title>Example email</title>
            </Head>
            <Layout preview="Example email" baseUrl={baseUrl} copyrights={title}>
                <Header
                    baseUrl={baseUrl}
                    logoUrl={logoUrl}
                    title={title}
                    hint={<Tooltip text="Goal state was changed" view="success" />}
                >
                    <Typography size="s" color="secondary">
                        ЦК Веб-разработки
                    </Typography>
                    <Space size="xs" />
                    <Typography size="m">#FRNTND-123: Разработка архитектуры ChatWM</Typography>
                </Header>
                <Comment
                    state={{ title: 'In progress', color: 'hsl(207 86% 65%)' }}
                    user={{ nickname: 'Tony Vi', name: 'Maxim Sviridov', email: 'mvasviridov@sbebank.ru' }}
                    body="На согласовании КА ФО. Осталось пройти УЭК и Инфру"
                />
                <Space size="s" />
                <ButtonLink title="Open goal" href={baseUrl} />
            </Layout>
        </Html>
    );
};

export default Example;

Example.PreviewProps = {
    baseUrl: 'http://localhost:3000',
    logoUrl: 'http://localhost:3000/static/sheep.png',
    title: 'Taskany Issues',
};
