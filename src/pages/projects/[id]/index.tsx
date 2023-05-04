import { ProjectPage, projectPageFetcher } from '../../../components/ProjectPage/ProjectPage';
import { parseFilterValues } from '../../../hooks/useUrlFilterParams';
import { declareSsrProps } from '../../../utils/declareSsrProps';

export const getServerSideProps = declareSsrProps(
    async ({ user, params: { id }, query, ssrHelpers }) => {
        const preset =
            typeof query.filter === 'string' ? await ssrHelpers.filter.getById.fetch(query.filter) : undefined;

        await ssrHelpers.filter.getUserFilters.fetch();

        const ssrData = await projectPageFetcher(
            user,
            id,
            ...Object.values(
                parseFilterValues(preset ? Object.fromEntries(new URLSearchParams(preset.params)) : query),
            ),
        );

        return ssrData.project
            ? {
                  fallback: {
                      ...ssrData,
                  },
              }
            : {
                  notFound: true,
              };
    },
    {
        private: true,
    },
);

export default ProjectPage;
