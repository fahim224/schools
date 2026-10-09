import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const roles = ['SUPERADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'STAFF']
    // رمز عبور ثابت برای همه: password123
    const password = await bcrypt.hash('password123', 10)

    for (const role of roles) {
        const email = `${role.toLowerCase()}@example.com`
        // استفاده از upsert برای جلوگیری از خطای تکراری بودن
        const user = await prisma.user.upsert({
            where: { email },
            update: {}, // اگر وجود داشت، تغییری نده
            create: {
                email,
                name: `${role} User`,
                password,
                role,
            },
        })
        console.log(`User created/verified: ${user.email} with role: ${user.role}`)
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
