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

    try {
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

      // Filter out orders with null staffId or missing staff relation
      const validOrders = orders.filter(order => 
        order.staffId !== null && 
        order.staffId !== undefined && 
        order.staff !== null
      );

      return NextResponse.json(validOrders);
    } catch (dbError: any) {
      // If error is due to null staffId, try querying without staff relation first
      if (dbError.code === 'P2032' || dbError.message?.includes('staffId')) {
        // Build WHERE conditions
        const conditions: string[] = ['"staffId" IS NOT NULL'];
        const params: any[] = [];
        let paramIndex = 1;

        if (status) {
          conditions.push(`status = $${paramIndex}`);
          params.push(status);
          paramIndex++;
        }

        if (tableNumber) {
          conditions.push(`"tableNumber" = $${paramIndex}`);
          params.push(parseInt(tableNumber));
          paramIndex++;
        }

        if (staffId) {
          conditions.push(`"staffId" = $${paramIndex}`);
          params.push(staffId);
          paramIndex++;
        }

        const whereClause = conditions.join(' AND ');

        // First get order IDs that have valid staffId using raw query
        const orderIds = await prisma.$queryRawUnsafe<{ id: number }[]>(
          `SELECT id FROM orders WHERE ${whereClause} ORDER BY "createdAt" DESC`,
          ...params
        );

        if (orderIds.length === 0) {
          return NextResponse.json([]);
        }

        const ids = orderIds.map(o => o.id);
        
        // Now fetch with relations
        const orders = await prisma.order.findMany({
          where: {
            id: { in: ids },
          },
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
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
} 