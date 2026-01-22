import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/cashier/payments - Create a payment record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, customerId, amount, receivedAmount, balance, paymentMode, referenceNumber } = body;

    if (!orderId || !customerId || !amount || receivedAmount === undefined) {
      return NextResponse.json(
        { error: 'Order ID, customer ID, amount, and received amount are required' },
        { status: 400 }
      );
    }

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        orderId: parseInt(orderId),
        customerId,
        amount,
        receivedAmount,
        balance: balance || 0,
        paymentMode,
        referenceNumber: referenceNumber || null,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any;
      switch (prismaError.code) {
        case 'P2002':
          return NextResponse.json(
            { error: 'A payment record already exists for this order' },
            { status: 409 }
          );
        case 'P2003':
          return NextResponse.json(
            { error: 'Invalid order or customer ID' },
            { status: 400 }
          );
        default:
          return NextResponse.json(
            { error: `Database error: ${prismaError.message || 'Unknown error'}` },
            { status: 500 }
          );
      }
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? `Server error: ${error.message}` : 'Failed to create payment' },
      { status: 500 }
    );
  }
}
