import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/kitchen/orders/[id]/status - Update order status sequentially
// Note: Order cancellation is handled by /api/orders/[id]/cancel endpoint
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    // Validate status transition
    const validTransitions = {
      'PENDING': 'PREPARING',
      'PREPARING': 'READY',
    };

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

    // Check if the status transition is valid
    if (!validTransitions[currentOrder.status as keyof typeof validTransitions] || 
        validTransitions[currentOrder.status as keyof typeof validTransitions] !== status) {
      return NextResponse.json(
        { error: `Invalid status transition from ${currentOrder.status} to ${status}` },
        { status: 400 }
      );
    }

    // Update the order status
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status },
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
      message: `Order status updated to ${status}`,
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