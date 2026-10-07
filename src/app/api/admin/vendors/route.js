import { getDb } from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = await getDb();
    const vendors = await db.collection('users')
      .find({ role: 'vendor' })
      .project({ password: 0 })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ vendors });
  } catch (error) {
    console.error('Fetch Vendors Admin Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, isApproved } = body;

    if (!userId || typeof isApproved !== 'boolean') {
      return NextResponse.json(
        { error: 'User ID and approval state are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId), role: 'vendor' },
      { $set: { isApproved } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Vendor account ${isApproved ? 'approved' : 'suspended'} successfully.`,
    });
  } catch (error) {
    console.error('Update Vendor Approval Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
