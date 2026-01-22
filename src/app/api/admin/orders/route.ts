import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/orders - Get all orders for admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tableNumber = searchParams.get('tableNumber');
    const staffId = searchParams.get('staffId');

    let whereClause: any = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (tableNumber) {
      whereClause.tableNumber = parseInt(tableNumber);
    }
    
    if (staffId) {
      whereClause.staffId = staffId;
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
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        payments: {
          select: {
            id: true,
            paymentMode: true,
            receivedAmount: true,
            balance: true,
            referenceNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
} 