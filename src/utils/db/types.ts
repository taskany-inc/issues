interface Membership {
    user: CrewUser;
    roles: CrewUserRole[];
    percentage?: number;
}

export interface Team {
    name: string;
    description?: string;
    id: string;
    memberships: Membership[];
}

export interface CrewUserRole {
    name: string;
}

export interface CrewUser {
    id: string;
    email: string;
    name?: string;
    image?: string;
    login?: string | null;
}
