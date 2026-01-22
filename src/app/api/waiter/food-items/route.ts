import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/waiter/food-items - Get all active food items with portions and categories for waiter
export async function GET() {
  try {
    const foodItems = await prisma.foodItem.findMany({
      where: {
        isActive: true,
        category: {
          isActive: true
        }
      },
      include: {
        category: true,
        foodItemPortions: {
          where: {
            portion: {
              isActive: true
            }
          },
          include: {
            portion: true
          },
          orderBy: {
            price: 'asc'
          }
        }
      },
      orderBy: [
        { category: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    // Group food items by category for easier rendering
    const categorizedItems = foodItems.reduce((acc: any, item) => {
      const categoryName = item.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = {
          category: item.category,
          items: []
        };
      }
      acc[categoryName].items.push(item);
      return acc;
    }, {});

    return NextResponse.json(categorizedItems);
  } catch (error) {
    console.error('Error fetching food items for waiter:', error);
    return NextResponse.json(
      { error: 'Failed to fetch food items' },
      { status: 500 }
    );
  }
} 