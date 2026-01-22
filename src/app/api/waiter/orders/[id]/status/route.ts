import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/waiter/orders/[id]/status - Update order status to SERVED
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    // Only allow updating to SERVED status
    if (status !== 'SERVED') {
      return NextResponse.json(
        { error: 'Waiters can only update orders to SERVED status' },
        { status: 400 }
      );
    }

    // Get current order
    const currentOrder = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      select: { status: true }
    });

    if (!currentOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Only allow updating from READY to SERVED
    if (currentOrder.status !== 'READY') {
      return NextResponse.json(
        { error: `Cannot serve order with status ${currentOrder.status}. Order must be READY to be served.` },
        { status: 400 }
      );
    }

    // Update the order status to SERVED
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status: 'SERVED' },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        orderItems: {
          include: {
            foodItem: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            portion: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Order has been served successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
} 