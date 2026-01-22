import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: {
        phone: phone
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true
      }
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error searching customer:', error);
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return NextResponse.json({ 
        error: 'Database connection not configured. Please check your DATABASE_URL environment variable.' 
      }, { status: 500 });
    }
    
    // Check if it's a Prisma client error
    if (error instanceof Error && error.message.includes('prisma')) {
      return NextResponse.json({ 
        error: 'Database client error. Please ensure the database is running and accessible.' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'Failed to search customer' }, { status: 500 });
  }
}
