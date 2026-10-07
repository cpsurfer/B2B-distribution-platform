import { getDb } from '@/lib/mongodb';
import { hashPassword } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { phone, password, businessName, email, taxId, licenseNumber, address } = body;

    // Phone, Password, and Shop Name/Business Name are required for small shop owners
    if (!phone || !password || !businessName) {
      return NextResponse.json(
        { error: 'Phone number, password, and shop/owner name are required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Check if phone number already registered
    const cleanPhone = phone.trim();
    const existingUser = await db.collection('users').findOne({ phone: cleanPhone });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Phone number already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // SECURE: Every user registering via the website signup form is strictly a vendor and starts unapproved.
    // No one can register as an admin from the frontend.
    const newUser = {
      phone: cleanPhone,
      password: hashedPassword,
      businessName: businessName.trim(),
      email: email ? email.toLowerCase().trim() : '',
      taxId: taxId ? taxId.trim() : '',
      licenseNumber: licenseNumber ? licenseNumber.trim() : '',
      address: address || {},
      role: 'vendor',
      isApproved: false, // Must be manually approved by the hardcoded admin
      createdAt: new Date(),
    };

    await db.collection('users').insertOne(newUser);

    return NextResponse.json(
      {
        message: 'Registration successful. Account pending admin approval.',
        isApproved: false,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
