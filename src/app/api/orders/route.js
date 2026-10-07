import { getDb } from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    let query = {};
    if (payload.role !== 'admin') {
      query.vendorId = new ObjectId(payload.userId);
    }

    // Fetch orders, join with user details to show business name and phone
    const orders = await db.collection('orders')
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'users',
            localField: 'vendorId',
            foreignField: '_id',
            as: 'vendorDetails'
          }
        },
        { $unwind: '$vendorDetails' },
        {
          $project: {
            _id: 1,
            vendorId: 1,
            items: 1,
            totalAmount: 1,
            paymentMethod: 1,
            orderStatus: 1,
            shippingAddress: 1,
            gpsLocation: 1,
            createdAt: 1,
            'vendorDetails.businessName': 1,
            'vendorDetails.phone': 1,
            'vendorDetails.email': 1
          }
        },
        { $sort: { createdAt: -1 } }
      ])
      .toArray();

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Fetch Orders Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items, shippingAddress, gpsLocation } = body; // items: [{ productId, quantity }], gpsLocation: { latitude, longitude }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in order' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Fetch product details
    const productIds = items.map(item => new ObjectId(item.productId));
    const products = await db.collection('products')
      .find({ _id: { $in: productIds } })
      .toArray();

    const productMap = products.reduce((acc, p) => {
      acc[p._id.toString()] = p;
      return acc;
    }, {});

    let totalAmount = 0;
    const orderItems = [];

    // Validate items and check stock
    for (const item of items) {
      const product = productMap[item.productId];
      if (!product) {
        return NextResponse.json(
          { error: `Product with ID ${item.productId} not found` },
          { status: 404 }
        );
      }

      if (item.quantity < product.minOrderQty) {
        return NextResponse.json(
          { error: `Minimum order quantity for ${product.name} is ${product.minOrderQty}` },
          { status: 400 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stock}` },
          { status: 400 }
        );
      }

      const itemCost = product.price * item.quantity;
      totalAmount += itemCost;

      orderItems.push({
        productId: product._id,
        name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        priceAtOrder: product.price,
      });
    }

    // Get user details
    const user = await db.collection('users').findOne({ _id: new ObjectId(payload.userId) });
    if (!user || !user.isApproved) {
      return NextResponse.json(
        { error: 'Unauthorized or account not approved' },
        { status: 403 }
      );
    }

    // Construct order document with GPS coordinates
    const newOrder = {
      vendorId: user._id,
      items: orderItems,
      totalAmount,
      paymentMethod: 'Cash on Delivery',
      orderStatus: 'Pending Delivery',
      shippingAddress: shippingAddress || user.address || {},
      gpsLocation: gpsLocation || null, // Stores latitude and longitude
      createdAt: new Date(),
    };

    // Deduct stock
    for (const item of orderItems) {
      await db.collection('products').updateOne(
        { _id: item.productId },
        { $inc: { stock: -item.quantity } }
      );
    }

    const result = await db.collection('orders').insertOne(newOrder);

    // If order was placed and GPS coordinates were provided, also update user's last known location
    if (gpsLocation && gpsLocation.latitude && gpsLocation.longitude) {
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { 'address.gpsLocation': gpsLocation } }
      );
    }

    return NextResponse.json(
      {
        message: 'Order placed successfully. Payment will be collected on delivery.',
        orderId: result.insertedId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create Order Error:', error);
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
    const { orderId, orderStatus } = body;

    if (!orderId || !orderStatus) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db.collection('orders').updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { orderStatus } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Order status updated to ${orderStatus} successfully.`,
    });
  } catch (error) {
    console.error('Update Order Status Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

