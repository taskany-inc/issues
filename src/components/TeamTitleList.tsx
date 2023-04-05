import NextLink from 'next/link';

import { Team } from '../../graphql/@generated/genql';
import { nullable } from '../utils/nullable';
import { routes } from '../hooks/router';

import { Link } from './Link';

export const TeamTitleList = ({ teams = [] }: { teams: Team[] }) => (
    <>
        {teams.map((team, i) =>
            nullable(team, (te) => (
                <span key={te.title}>
                    <NextLink key={te.id} passHref href={routes.team(te.id)}>
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
