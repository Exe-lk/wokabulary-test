import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/orders/[id]/cancel - Cancel an order (only if status is PENDING)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { reason } = await request.json();

    // Get current order with detailed ingredient information
    const currentOrder = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      select: { 
        status: true,
        tableNumber: true,
        totalAmount: true,
        orderItems: {
          select: {
            id: true,
            quantity: true,
            foodItem: { 
              select: { 
                id: true,
                name: true 
              } 
            },
            portion: { 
              select: { 
                id: true,
                name: true 
              } 
            }
          }
        }
      }
    });

    if (!currentOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Only allow cancellation if order is in PENDING status
    if (currentOrder.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot cancel order with status ${currentOrder.status}. Only orders in PENDING status can be cancelled.` },
        { status: 400 }
      );
    }

    // Cancel order and restore ingredients (serverless-friendly approach)
    // Step 1: Calculate ingredient quantities to restore
    const ingredientRestorations = new Map<string, number>();

    // Process each order item to calculate ingredient restoration
    for (const orderItem of currentOrder.orderItems) {
      // Find the food item portion to get ingredient requirements
      const foodItemPortion = await prisma.foodItemPortion.findUnique({
        where: {
          foodItemId_portionId: {
            foodItemId: orderItem.foodItem.id,
            portionId: orderItem.portion.id,
          },
        },
        include: {
          ingredients: {
            include: {
              ingredient: true,
            },
          },
        },
      });

      if (foodItemPortion) {
        // Calculate ingredient quantities for this order item
        for (const ingredient of foodItemPortion.ingredients) {
          const requiredQuantity = ingredient.quantity * orderItem.quantity;
          const existingQuantity = ingredientRestorations.get(ingredient.ingredientId) || 0;
          ingredientRestorations.set(ingredient.ingredientId, existingQuantity + requiredQuantity);
        }
      }
    }

    // Step 2: Restore ingredient stock
    for (const [ingredientId, quantityToRestore] of ingredientRestorations) {
      const ingredient = await prisma.ingredient.findUnique({
        where: { id: ingredientId },
        select: { name: true, currentStockQuantity: true, unitOfMeasurement: true }
      });

      if (ingredient) {
        await prisma.ingredient.update({
          where: { id: ingredientId },
          data: {
            currentStockQuantity: {
              increment: quantityToRestore,
            },
          },
        });

        console.log(`Restored ${quantityToRestore} ${ingredient.unitOfMeasurement} of ${ingredient.name} to inventory (Order #${id} cancelled)`);
      }
    }

    // Step 3: Update the order status to CANCELLED
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { 
        status: 'CANCELLED',
        notes: reason ? `CANCELLED: ${reason}` : 'CANCELLED',
        updatedAt: new Date()
      },
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
      message: 'Order has been cancelled successfully and ingredients have been restored to inventory',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}
