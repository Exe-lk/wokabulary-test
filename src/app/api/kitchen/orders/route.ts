import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/kitchen/orders - Get orders for kitchen staff (PENDING, PREPARING, READY)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let whereClause: any = {
      status: {
        in: ['PENDING', 'PREPARING', 'READY']
      }
    };
    
    if (status && ['PENDING', 'PREPARING', 'READY'].includes(status)) {
      whereClause.status = status;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
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
      orderBy: [
        { status: 'asc' }, // PENDING first, then PREPARING, then READY
        { createdAt: 'asc' }, // Oldest first within each status
      ],
    });

    // Fetch ingredient details for each order item
    const ordersWithIngredients = await Promise.all(
      orders.map(async (order) => {
        const orderItemsWithIngredients = await Promise.all(
          order.orderItems.map(async (orderItem) => {
            // Find the food item portion to get ingredients
            const foodItemPortion = await prisma.foodItemPortion.findFirst({
              where: {
                foodItemId: orderItem.foodItem.id,
                portionId: orderItem.portion.id,
              },
              include: {
                ingredients: {
                  include: {
                    ingredient: {
                      select: {
                        id: true,
                        name: true,
                        unitOfMeasurement: true,
                      },
                    },
                  },
                },
              },
            });

            return {
              ...orderItem,
              ingredients: foodItemPortion?.ingredients || [],
            };
          })
        );

        return {
          ...order,
          orderItems: orderItemsWithIngredients,
        };
      })
    );

    return NextResponse.json(ordersWithIngredients);
  } catch (error) {
    console.error('Error fetching kitchen orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
} 