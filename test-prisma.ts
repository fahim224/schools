import { PrismaClient } from '@prisma/client'
/**
 * Note: If the import is failing, ensure you have:
 * 1. Run `npm install @prisma/client`
 * 2. Run `npx prisma generate` after defining your schema.prisma
 */

try {
    const prisma = new PrismaClient()
    console.log('PrismaClient successfully instantiated!')
    console.log('Datasources:', (prisma as any)._clientEngineType) // Just to check something internal
} catch (e) {
    console.error('Failed to instantiate PrismaClient:', e)
}
