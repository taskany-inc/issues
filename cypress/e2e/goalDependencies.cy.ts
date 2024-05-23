import '../support';
import { routes } from '../../src/hooks/router';
import {
    goalDependenciesInput,
    goalDependenciesSuggestionItemTitle,
    goalDependenciesSwitch,
    goalDependenciesTrigger,
    goalDependencyGoalsListItem,
    goalDependencyKindBlocks,
    goalDependencyKindDependsOn,
    goalDependencyKindRelatedTo,
} from '../../src/utils/domObjects';
import { keyPredictor } from '../../src/utils/keyPredictor';

enum dependencyKind {
    dependsOn = 'dependsOn',
    blocks = 'blocks',
    relatedTo = 'relatedTo',
}

const userEmail = 'user@taskany.org';
const userPassword = 'taskany';

const adminTestGoalDependenciesTitle = 'Admin goal test dependencies';
const userTestGoalDependenciesTitle = 'User goal test dependencies';

const goalTitleBlocks = `Goal test ${dependencyKind.blocks}`;
const goalTitleDependsOn = `Goal test ${dependencyKind.dependsOn}`;
const goalTitleRelatedTo = `Goal test ${dependencyKind.relatedTo}`;

const projectTitle = 'Test dependencies';

const createGoal = (title: string, projectId: string, ownerEmail = Cypress.env('ADMIN_EMAIL')) => {
    return cy.task('db:create:goal', {
        title,
        projectId,
        ownerEmail,
    });
};

before(() => {
    cy.task('db:create:project', {
        title: projectTitle,
        key: keyPredictor(projectTitle),
        ownerEmail: Cypress.env('ADMIN_EMAIL'),
    }).then((project: { id: string }) => {
        Cypress.env('projectId', project.id);

        createGoal(userTestGoalDependenciesTitle, project.id, userEmail).then(({ id, _shortId }) => {
            Cypress.env('userGoal', { id, _shortId });
        });
        createGoal(adminTestGoalDependenciesTitle, project.id).then(({ id, _shortId }) => {
            Cypress.env('adminGoal', { id, _shortId });
        });
        createGoal(goalTitleBlocks, project.id).then(({ id, _shortId }) => {
            Cypress.env(`${dependencyKind.blocks}Goal`, { id, _shortId });
        });
        createGoal(goalTitleDependsOn, project.id).then(({ id, _shortId }) => {
            Cypress.env(`${dependencyKind.dependsOn}Goal`, { id, _shortId });
        });
        createGoal(goalTitleRelatedTo, project.id).then(({ id, _shortId }) => {
            Cypress.env(`${dependencyKind.relatedTo}Goal`, { id, _shortId });
        });
    });
});

after(() => {
    cy.task('db:remove:project', { id: Cypress.env('projectId') });
    cy.task('db:remove:goal', { id: Cypress.env('adminGoal').id });
    cy.task('db:remove:goal', { id: Cypress.env('userGoal').id });
    cy.task('db:remove:goal', { id: Cypress.env(`${dependencyKind.blocks}Goal`).id });
    cy.task('db:remove:goal', { id: Cypress.env(`${dependencyKind.dependsOn}Goal`).id });
    cy.task('db:remove:goal', { id: Cypress.env(`${dependencyKind.relatedTo}Goal`).id });
});

const checkList = (
    kindQuery:
        | typeof goalDependencyKindBlocks
        | typeof goalDependencyKindDependsOn
        | typeof goalDependencyKindRelatedTo,
    filterText: string,
) => {
    cy.get(kindQuery.query)
        .get(goalDependencyGoalsListItem.query)
        .filter(`:contains(${filterText})`)
        .should('exist')
        .and('contain.text', filterText);
};

const addDependency = (title: string, relationKind: keyof typeof dependencyKind) => {
    cy.get(goalDependenciesInput.query).type(title);
    cy.get(goalDependenciesSwitch.query).get(`button[value="${relationKind}"]`).click();

    cy.get(goalDependenciesSuggestionItemTitle.query)
        .filter(`:contains(${title})`)
        .should('exist')
        .and('contain.text', title)
        .click()
        .should('not.exist');
};

const checkSelectingDependencies = () => {
    describe('check open popup dependencies', () => {
        beforeEach(() => {
            cy.get(goalDependenciesTrigger.query).should('exist').click();
        });

        it('dependencies kind should exist', () => {
            Object.values(dependencyKind).forEach((kind) => {
                cy.get(goalDependenciesSwitch.query).get(`button[value="${kind}"]`).should('exist');
            });
        });

        it('add blocked dependency', () => {
            addDependency(goalTitleBlocks, dependencyKind.blocks);
        });

        it('add dependsOn dependency', () => {
            addDependency(goalTitleDependsOn, dependencyKind.dependsOn);
        });

        it('add relatedTo dependency', () => {
            addDependency(goalTitleRelatedTo, dependencyKind.relatedTo);
        });
    });

    describe('check goal dependencies lists', () => {
        it('check blocks list', () => {
            checkList(goalDependencyKindBlocks, goalTitleBlocks);
        });

        it('check dependsOn list', () => {
            checkList(goalDependencyKindDependsOn, goalTitleDependsOn);
        });

        it('check relatedTo list', () => {
            checkList(goalDependencyKindRelatedTo, goalTitleRelatedTo);
        });
    });

    describe('check suggestions', () => {
        it('selected goals should not be visible in suggestions', (done) => {
            cy.get(goalDependenciesTrigger.query).click();

            cy.get(goalDependenciesSuggestionItemTitle.query).then(($elements) => {
                if ($elements.length === 0) {
                    done();
                }

                expect(
                    Array.from($elements).some(($el) =>
                        [goalTitleBlocks, goalTitleDependsOn, goalTitleRelatedTo].includes(Cypress.$($el).text()),
                    ),
                ).to.be.false;
                done();
            });
        });
    });
};

describe('GoalDependencies', () => {
    describe('admin', () => {
        beforeEach(() => {
            cy.signInViaEmail();
            cy.visit(routes.goal(Cypress.env('adminGoal')._shortId));
        });

        checkSelectingDependencies();
    });

    describe('user', () => {
        beforeEach(() => {
            cy.signInViaEmail({ email: userEmail, password: userPassword });
        });

        it('user is not goal owner', () => {
            cy.visit(routes.goal(Cypress.env('adminGoal')._shortId));
            cy.get(goalDependenciesTrigger.query).should('not.exist');
        });

        describe('user is goal owner', () => {
            beforeEach(() => {
                cy.visit(routes.goal(Cypress.env('userGoal')._shortId));
            });

            checkSelectingDependencies();
        });
    });

    describe('check dependencies from connected goals', () => {
        beforeEach(() => {
            cy.signInViaEmail();
        });

        it('blocks kind should be dependsOn in connected goal', () => {
            cy.visit(routes.goal(Cypress.env(`${dependencyKind.blocks}Goal`)._shortId));

            checkList(goalDependencyKindDependsOn, adminTestGoalDependenciesTitle);
        });

        it('dependsOn kind should be Block in connected goal', () => {
            cy.visit(routes.goal(Cypress.env(`${dependencyKind.dependsOn}Goal`)._shortId));

            checkList(goalDependencyKindBlocks, adminTestGoalDependenciesTitle);
        });

        it('relatedTo kind should be relatedTo in connected goal', () => {
            cy.visit(routes.goal(Cypress.env(`${dependencyKind.relatedTo}Goal`)._shortId));

            checkList(goalDependencyKindRelatedTo, adminTestGoalDependenciesTitle);
        });
    });
});
