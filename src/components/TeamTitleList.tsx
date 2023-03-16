import NextLink from 'next/link';

import { nullable } from '@common/utils/nullable';

import { Team } from '../../graphql/@generated/genql';
import { routes } from '../hooks/router';

import { Link } from './Link';

export const TeamTitleList = ({ teams = [] }: { teams: Team[] }) => (
    <>
        {teams.map((team, i) =>
            nullable(team, (te) => (
                <span key={te.title}>
                    <NextLink key={te.key} passHref href={routes.team(te.key)}>
                        <Link inline title={te.description}>
                            {te.title}
                        </Link>
                    </NextLink>
                    {i < teams.length - 1 ? ', ' : ''}
                </span>
            )),
        )}
    </>
);
