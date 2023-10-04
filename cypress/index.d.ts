export {};

type SignIn = {
    email: string;
    password: string;
};

type CreateProjectFields = {
    title: string;
    description?: string;
};
interface UserData {
    user: {
        name: string;
        email: string;
        image: string | null;
        id: string;
        role: 'ADMIN' | 'USER';
        nickname: string;
        activityId: string;
        settings: {
            id: string;
            theme: 'light' | 'dark';
            beta: boolean;
            flowId: string | null;
            createdAt: string;
            updatedAt: string;
        };
    };
    expires: string;
}
declare global {
    namespace Cypress {
        interface Chainable {
            signInViaEmail(fields?: SignIn): Chainable<void>;
            createProject(fields: CreateProjectFields): Chainable<void>;
            task(
                event: 'db:create:project',
                data: { title: string; key: string; description?: string; ownerEmail: string },
            ): Chainable<any>;
            task(event: 'db:remove:project', data: { id: string }): Chainable<null>;
            task(
                event: 'db:create:user',
                data: { email: string; name?: string; password: string; provider: string },
            ): Chainable<UserData['user']>;
            task(event: 'db:remove:user', data: { id: string }): Chainable<null>;
            task(event: 'db:remove:user', data?: { ids: string[] }): Chainable<null>;
        }
        interface Cypress {
            env(): {
                currentUser: UserData;
                ADMIN_EMAIL: string;
                ADMIN_PASSWORD: string;
                defaultPriority: 'Medium';
            };
            env(key: 'currentUser'): UserData;
            env(key: 'currentUser', value: UserData): void;
            env(key: 'ADMIN_EMAIL'): string;
            env(key: 'ADMIN_EMAIL', value: string): void;
            env(key: 'ADMIN_PASSWORD'): string;
            env(key: 'ADMIN_PASSWORD', value: string): void;
            env(key: 'defaultPriority'): 'Medium';
            env(key: 'stubProject'): string;
            env(key: 'stubProject', value: string): void;
            env(key: 'createdGoal', value: any): void;
            env(key: 'createdGoal'): any;
            env(key: 'testUser', value: UserData['user']): void;
            env(key: 'testUser'): UserData['user'];
        }
    }
}
