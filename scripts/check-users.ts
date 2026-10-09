import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany()
    console.log('--- Current Users in Database ---')
    users.forEach(u => {
        console.log(`Email: ${u.email}, Role: ${u.role}, Has Password: ${!!u.password}`)
    })
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
