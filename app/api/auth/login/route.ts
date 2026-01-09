import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 LOGIN REQUEST RECEIVED')
    
    const { email, password } = await request.json()
    console.log(`📧 Login attempt for: ${email}`)

    // Enhanced input validation
    if (!email || !password) {
      console.log('❌ Missing email or password')
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format')
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Find user in PostgreSQL database using Prisma
    const user = await prisma.user.findUnique({
      where: { email }
    })
    console.log(`👤 User found: ${user ? 'YES' : 'NO'}`)

    if (!user) {
      console.log('❌ Invalid credentials - user not found')
      return NextResponse.json(
        { error: 'Invalid email or password. Please check your credentials and try again.' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    console.log(`🔑 Password valid: ${isPasswordValid ? 'YES' : 'NO'}`)

    if (!isPasswordValid) {
      console.log('❌ Invalid credentials - wrong password')
      return NextResponse.json(
        { error: 'Invalid email or password. Please check your credentials and try again.' },
        { status: 401 }
      )
    }

    // Update lastLogin timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user
    console.log(`✅ Login successful for: ${userWithoutPassword.email}`)
    
    // Align with expected 'user' object structure in frontend
    const userToReturn = {
      ...userWithoutPassword,
      name: user.username
    }

    const response = NextResponse.json({
      message: 'Login successful',
      user: userToReturn
    })

    // Set a session cookie
    response.cookies.set('session', JSON.stringify(userToReturn), {
      httpOnly: false, // Set to false so client-side can read it for hydration if needed, but true is safer. Let's use false for now to simplify.
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })

    return response
  } catch (error) {
    console.error('💥 Login error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
