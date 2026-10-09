const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    try {
        const userCount = await prisma.user.count()
        console.log(`User Count: ${userCount}`)

        const users = await prisma.user.findMany({
            select: {
                email: true,
                role: true
            }
        })
        console.log('Users in DB:', JSON.stringify(users, null, 2))
    } catch (err) {
        console.error('Error fetching users:', err)
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
