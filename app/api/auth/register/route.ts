import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('📝 REGISTRATION REQUEST RECEIVED')
    
    const { email, password, name } = await request.json()
    console.log(`📧 New user registration: ${email}`)

    // Validate input
    if (!email || !password) {
      console.log('❌ Missing email or password')
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      console.log('❌ Password too short')
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    console.log(`👤 User already exists: ${existingUser ? 'YES' : 'NO'}`)

    if (existingUser) {
      console.log('❌ User with this email already exists')
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)
    console.log('🔐 Password hashed successfully')

    // Create user in PostgreSQL database using Prisma
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username: name || email.split('@')[0]
      }
    })

    console.log(`✅ New user created: ${email}`)

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = newUser

    // Align with expected 'user' object structure in frontend
    const userToReturn = {
      ...userWithoutPassword,
      name: newUser.username
    }

    const response = NextResponse.json(
      { 
        message: 'User created successfully',
        user: userToReturn
      },
      { status: 201 }
    )

    // Set a session cookie
    response.cookies.set('session', JSON.stringify(userToReturn), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })

    return response
  } catch (error) {
    console.error('💥 Registration error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
