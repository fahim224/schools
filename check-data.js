const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const classes = await prisma.schoolClass.count()
    const students = await prisma.user.count({ where: { role: 'STUDENT' } })
    console.log(`Classes: ${classes}, Students: ${students}`)
}

main().finally(() => prisma.$disconnect())
