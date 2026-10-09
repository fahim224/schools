const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const students = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: {
            id: true,
            name: true,
            studentId: true,
            createdById: true,
        }
    })

    console.log('Total students:', students.length)
    console.log('Students samples:', JSON.stringify(students.slice(0, 10), null, 2))

    const admins = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
        select: {
            id: true,
            name: true,
            email: true,
            role: true
        }
    })
    console.log('Admins/SuperAdmins:', JSON.stringify(admins, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
