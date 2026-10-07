import { getDb } from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

const MOCK_PRODUCTS = [
  {
    name: 'Classic Gold Cigarettes (Carton)',
    sku: 'CIG-CLS-GLD-01',
    description: '10 packs of 20 cigarettes. Light, smooth blend with gold tobacco leaves.',
    price: 1450.00,
    minOrderQty: 5,
    stock: 500,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300', // Groceries/Shop placeholder
    isActive: true,
  },
  {
    name: 'Red Bold Cigarettes (Carton)',
    sku: 'CIG-RED-BLD-02',
    description: '10 packs of 20 cigarettes. Full-flavored, rich toasted American blend.',
    price: 1550.00,
    minOrderQty: 5,
    stock: 350,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300',
    isActive: true,
  },
  {
    name: 'Menthol Fresh Cigarettes (Carton)',
    sku: 'CIG-MNT-FRS-03',
    description: '10 packs of 20 cigarettes. Cool peppermint filter blend for refreshing taste.',
    price: 1600.00,
    minOrderQty: 5,
    stock: 200,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300',
    isActive: true,
  },
  {
    name: 'Handcrafted Reserve Cigars (Box of 10)',
    sku: 'CIGAR-HND-RSV-04',
    description: 'Premium aged tobacco leaves, hand-rolled in Honduras. Medium body.',
    price: 4500.00,
    minOrderQty: 2,
    stock: 80,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300',
    isActive: true,
  },
];

export async function GET(request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const db = await getDb();
    
    // Seed products if database is empty
    const count = await db.collection('products').countDocuments();
    if (count === 0) {
      await db.collection('products').insertMany(MOCK_PRODUCTS);
    }

    const products = await db.collection('products').find({ isActive: true }).toArray();
    return NextResponse.json({ products });
  } catch (error) {
    console.error('Fetch Products Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, sku, description, price, minOrderQty, stock, image } = body;

    if (!name || !sku || !price) {
      return NextResponse.json(
        { error: 'Product name, SKU, and price are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const newProduct = {
      name,
      sku,
      description: description || '',
      price: parseFloat(price),
      minOrderQty: parseInt(minOrderQty) || 1,
      stock: parseInt(stock) || 0,
      image: image || '',
      isActive: true,
      createdAt: new Date(),
    };

    const result = await db.collection('products').insertOne(newProduct);
    return NextResponse.json({
      message: 'Product added successfully',
      productId: result.insertedId,
    }, { status: 201 });
  } catch (error) {
    console.error('Create Product Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection('products').updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive: false } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete Product Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
