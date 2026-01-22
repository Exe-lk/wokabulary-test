import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const foodItemId = searchParams.get('foodItemId');
    const portionId = searchParams.get('portionId');

    if (!foodItemId || !portionId) {
      return NextResponse.json(
        { error: 'Food item ID and portion ID are required' },
        { status: 400 }
      );
    }

    // Get ingredients for the specific food item portion
    const foodItemPortion = await prisma.foodItemPortion.findFirst({
      where: {
        foodItemId: foodItemId,
        portionId: portionId,
      },
      include: {
        ingredients: {
          include: {
            ingredient: {
              select: {
                id: true,
                name: true,
                unitOfMeasurement: true,
                currentStockQuantity: true,
                reorderLevel: true,
              },
            },
          },
        },
      },
    });

    if (!foodItemPortion) {
      return NextResponse.json(
        { error: 'Food item portion not found' },
        { status: 404 }
      );
    }

    // Format the response
    const ingredients = foodItemPortion.ingredients.map(fpi => ({
      id: fpi.ingredient.id,
      name: fpi.ingredient.name,
      quantity: fpi.quantity,
      unit: fpi.ingredient.unitOfMeasurement,
      currentStock: fpi.ingredient.currentStockQuantity,
      reorderLevel: fpi.ingredient.reorderLevel,
      stockStatus: fpi.ingredient.currentStockQuantity > fpi.ingredient.reorderLevel ? 'IN_STOCK' : 
                   fpi.ingredient.currentStockQuantity > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK',
    }));

    return NextResponse.json({
      foodItemPortionId: foodItemPortion.id,
      ingredients: ingredients,
    });

  } catch (error) {
    console.error('Error fetching food item ingredients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch food item ingredients' },
      { status: 500 }
    );
  }
}
