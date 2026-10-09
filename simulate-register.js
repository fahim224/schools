const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    try {
        const email = 'test' + Date.now() + '@example.com';
        const password = 'password123';
        const name = 'Test User';

        console.log('Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Hash:', hashedPassword);

        console.log('Creating user in DB...');
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });
        console.log('User created:', user);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
