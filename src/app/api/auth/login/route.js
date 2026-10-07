import { getDb } from '@/lib/mongodb';
import { comparePassword, signToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body; // username can be phone or email

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Phone/Email and password are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const cleanUsername = username.trim();

    // Query by either phone or email
    const user = await db.collection('users').findOne({
      $or: [
        { phone: cleanUsername },
        { email: cleanUsername.toLowerCase() }
      ]
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid phone/email or password' },
        { status: 401 }
      );
    }

    // Compare password
    const isPasswordMatch = await comparePassword(password, user.password);
    if (!isPasswordMatch) {
      return NextResponse.json(
        { error: 'Invalid phone/email or password' },
        { status: 401 }
      );
    }

    // Check if account is approved
    if (!user.isApproved) {
      return NextResponse.json(
        { error: 'Your account is pending administrator approval. Please contact support.' },
        { status: 403 }
      );
    }

    // Sign token
    const token = signToken({
      userId: user._id.toString(),
      phone: user.phone,
      role: user.role,
      businessName: user.businessName,
    });

    // Create response
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        phone: user.phone,
        role: user.role,
        businessName: user.businessName,
      },
    });

    // Set cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
