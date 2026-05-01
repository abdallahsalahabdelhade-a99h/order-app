'use server'

import { prisma } from '@/lib/prisma'

// In a real application, we would use NextAuth or similar, and check session here.
// For demonstration, we assume the caller provides their adminId to verify permissions.
export async function createRestaurantAdmin(data: {
  callerId: string, // The ID of the SUPER_ADMIN making the request
  name: string,
  username: string,
  restaurantId: string
}) {
  try {
    // 1. Verify caller is SUPER_ADMIN
    const caller = await prisma.user.findUnique({
      where: { id: data.callerId }
    })

    if (!caller || caller.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Unauthorized: Only Super Admins can create Restaurant Admins.' }
    }

    // 2. Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: data.username }
    })

    if (existingUser) {
      return { success: false, error: 'Username already taken.' }
    }

    // 3. Hash a generated or default password (in real app, send invitation email or hash with bcrypt)
    const defaultPassword = 'tempPassword123!' // Should be hashed with bcrypt

    // 4. Create the user and link to the restaurant
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        password: defaultPassword,
        role: 'RESTAURANT_ADMIN',
        managedRestaurantId: data.restaurantId
      }
    })

    return { success: true, user: newUser }
  } catch (error: any) {
    console.error('Error creating restaurant admin:', error)
    return { success: false, error: error.message || 'Something went wrong' }
  }
}
