import { TRPCError } from '@trpc/server';

import { ProjectSettingsPage } from '../../../components/ProjectSettingsPage/ProjectSettingsPage';
import { routes } from '../../../hooks/router';
import { declareSsrProps } from '../../../utils/declareSsrProps';

export const getServerSideProps = declareSsrProps(
    async ({ ssrHelpers, params: { id } }) => {
        try {
            const project = await ssrHelpers.v2.project.getById.fetch({ id });
            await ssrHelpers.v2.project.deepChildrenIds.fetch({ in: [{ id }] });

            if (!project) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }

            if (!project._isEditable) {
                return {
                    redirect: {
                        permanent: false,
                        destination: routes.project(project.id),
                    },
                };
            }
        } catch (e: unknown) {
            if (e instanceof TRPCError && (e.code === 'FORBIDDEN' || e.code === 'NOT_FOUND')) {
                return {
                    notFound: true,
                };
            }
        }
    },
    {
        private: true,
    },
);

export default ProjectSettingsPage;
