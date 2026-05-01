import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Create Super Admin
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'المسؤول الرئيسي',
      username: 'admin',
      password: 'admin123',
      role: 'SUPER_ADMIN',
    },
  })

  // Create Restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'مطعم أبو طارق',
      deliveryNumber: '01012345678',
      logoUrl: 'https://placehold.co/400x400/orange/white?text=Koshary',
      categories: {
        create: [
          {
            title: 'وجبات كشري',
            items: {
              create: [
                { name: 'كشري صغير', price: 20 },
                { name: 'كشري وسط', price: 30 },
                { name: 'كشري كبير', price: 40 },
              ]
            }
          },
          {
            title: 'إضافات',
            items: {
              create: [
                { name: 'صلصة زيادة', price: 5 },
                { name: 'دقة', price: 5 },
              ]
            }
          }
        ]
      }
    }
  })

  // Create another Restaurant
  await prisma.restaurant.create({
    data: {
      name: 'فول وطعمية البغل',
      deliveryNumber: '01112345678',
      categories: {
        create: [
          {
            title: 'سندوتشات',
            items: {
              create: [
                { name: 'فول إسكندراني', price: 15 },
                { name: 'طعمية محشية', price: 15 },
              ]
            }
          }
        ]
      }
    }
  })

  console.log('Seeding finished.')
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
