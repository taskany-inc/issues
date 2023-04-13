import NextLink from 'next/link';

import { Project } from '../../graphql/@generated/genql';
import { nullable } from '../utils/nullable';
import { routes } from '../hooks/router';

import { Link } from './Link';

export const ProjectTitleList = ({ projects = [] }: { projects: Project[] }) => (
    <>
        {projects.map((project, i) =>
            nullable(project, (pr) => (
                <span key={pr.title}>
                    <NextLink key={pr.id} passHref href={routes.project(pr.id)}>
                        <Link inline title={pr.description}>
                            {pr.title}
                        </Link>
                    </NextLink>
                    {i < projects.length - 1 ? ', ' : ''}
                </span>
            )),
        )}
    </>
);
