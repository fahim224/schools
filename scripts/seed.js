require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
})

async function main() {
    const roles = ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'STAFF']
    const password = await bcrypt.hash('password123', 10)

    for (const role of roles) {
        const email = `${role.toLowerCase()}@example.com`
        const user = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                email,
                name: `${role} User`,
                password,
                role,
            },
        })
        console.log(`Created user: ${user.email} with role: ${user.role}`)
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error("DATABASE_URL:", process.env.DATABASE_URL)
        console.error("FULL ERROR:", JSON.stringify(e, null, 2))
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
