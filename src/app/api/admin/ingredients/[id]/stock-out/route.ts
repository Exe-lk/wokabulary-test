import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { quantity } = await request.json();

    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Valid quantity is required' },
        { status: 400 }
      );
    }

    // Check if ingredient exists
    const existingIngredient = await prisma.ingredient.findUnique({
      where: { id },
    });

    if (!existingIngredient) {
      return NextResponse.json(
        { error: 'Ingredient not found' },
        { status: 404 }
      );
    }

    // Check if there's sufficient stock
    if (existingIngredient.currentStockQuantity < quantity) {
      return NextResponse.json(
        { 
          error: `Insufficient stock. Available: ${existingIngredient.currentStockQuantity} ${existingIngredient.unitOfMeasurement}, Requested: ${quantity} ${existingIngredient.unitOfMeasurement}` 
        },
        { status: 400 }
      );
    }

    // Update the stock quantity (decrement)
    const updatedIngredient = await prisma.ingredient.update({
      where: { id },
      data: {
        currentStockQuantity: {
          decrement: quantity,
        },
      },
    });

    return NextResponse.json({
      ...updatedIngredient,
      stockOutQuantity: quantity,
      previousStock: existingIngredient.currentStockQuantity
    });
  } catch (error) {
    console.error('Error processing stock out:', error);
    return NextResponse.json(
      { error: 'Failed to process stock out' },
      { status: 500 }
    );
  }
}
