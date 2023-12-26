import { prisma } from '../prisma';

export const updateProjectUpdatedAt = async (id?: string | null) => {
    if (!id) return;

    return prisma.project.update({
        where: { id },
        data: { id },
    });
};
