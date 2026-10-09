const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Checking Categories...');
        const categories = await prisma.category.findMany({ include: { subjects: true } });
        console.log('Categories:', JSON.stringify(categories, null, 2));

        console.log('Checking SchoolClasses...');
        const classes = await prisma.schoolClass.findMany({ include: { _count: true } });
        console.log('Classes:', JSON.stringify(classes, null, 2));

        console.log('Checking Subjects...');
        const subjects = await prisma.subject.findMany();
        console.log('Subjects:', JSON.stringify(subjects, null, 2));

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
