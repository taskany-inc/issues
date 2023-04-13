import NextLink from 'next/link';
import { Link, nullable } from '@taskany/bricks';

import { Team } from '../../graphql/@generated/genql';
import { routes } from '../hooks/router';

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
