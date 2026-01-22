import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Get yesterday's date range for comparison
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1);

    // Fetch today's orders
    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
        status: {
          not: 'CANCELLED'
        }
      },
      include: {
        orderItems: true
      }
    });

    // Fetch yesterday's orders for comparison
    const yesterdayOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfYesterday,
          lt: endOfYesterday,
        },
        status: {
          not: 'CANCELLED'
        }
      }
    });

    // Calculate today's revenue
    const todayRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const yesterdayRevenue = yesterdayOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Calculate revenue percentage change
    const revenueChange = yesterdayRevenue > 0 
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
      : 0;

    // Get active tables (orders that are not completed or cancelled)
    const activeTables = await prisma.order.findMany({
      where: {
        status: {
          in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED']
        }
      },
      select: {
        tableNumber: true
      },
      distinct: ['tableNumber']
    });

    // Get total number of tables (assuming max table number from orders)
    const maxTableNumber = await prisma.order.aggregate({
      _max: {
        tableNumber: true
      }
    });

    const totalTables = maxTableNumber._max.tableNumber || 0;
    const inactiveTables = totalTables - activeTables.length;

    // Get total food items
    const totalFoodItems = await prisma.foodItem.count({
      where: {
        isActive: true
      }
    });

    // Get total categories
    const totalCategories = await prisma.category.count({
      where: {
        isActive: true
      }
    });

    // Get low stock ingredients (below reorder level)
    const lowStockIngredients = await prisma.ingredient.count({
      where: {
        isActive: true,
        currentStockQuantity: {
          lte: prisma.ingredient.fields.reorderLevel
        }
      }
    });

    // Calculate order count percentage change
    const orderCountChange = yesterdayOrders.length > 0 
      ? ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length) * 100 
      : 0;

    const stats = {
      todayOrders: todayOrders.length,
      todayRevenue: todayRevenue,
      activeTables: activeTables.length,
      inactiveTables: inactiveTables,
      totalFoodItems,
      totalCategories,
      lowStockIngredients,
      revenueChange: Math.round(revenueChange * 100) / 100,
      orderCountChange: Math.round(orderCountChange * 100) / 100
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
