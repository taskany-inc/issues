import NextLink from 'next/link';
import { nullable, Link } from '@taskany/bricks';

import { routes } from '../hooks/router';

interface ProjectTitleListProps {
    projects: Array<{ id: string; title: string; description?: string | null }>;
}

export const ProjectTitleList: React.FC<ProjectTitleListProps> = ({ projects = [] }) => (
    <>
        {projects.map((project, i) =>
            nullable(project, (pr) => (
                <span key={pr.title}>
                    <NextLink key={pr.id} passHref href={routes.project(pr.id)}>
                        <Link inline title={pr.description ?? undefined}>
                            {pr.title}
                        </Link>
                    </NextLink>
                    {i < projects.length - 1 ? ', ' : ''}
                </span>
            )),
        )}
    </>
);
