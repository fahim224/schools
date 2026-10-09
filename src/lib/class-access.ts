import { prisma } from "@/lib/prisma";

type SessionUser = {
    id?: string;
    role?: string;
};

export async function getManagedClass(classId: string, user: SessionUser) {
    const schoolClass = await prisma.schoolClass.findUnique({
        where: { id: classId },
        select: {
            id: true,
            academicYear: true,
            teacherId: true,
            createdById: true,
        },
    });

    if (!schoolClass || !user.id || !user.role) {
        return { schoolClass, allowed: false };
    }

    const allowed =
        user.role === "SUPERADMIN" ||
        (user.role === "ADMIN" && schoolClass.createdById === user.id) ||
        (user.role === "TEACHER" &&
            (schoolClass.teacherId === user.id || schoolClass.createdById === user.id));

    return { schoolClass, allowed };
}
