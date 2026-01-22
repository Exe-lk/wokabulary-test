import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, description, unitOfMeasurement, reorderLevel, isActive } = await request.json();

    if (!name || !unitOfMeasurement) {
      return NextResponse.json(
        { error: 'Name and unit of measurement are required' },
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

    // Check if another ingredient with same name already exists (excluding current one)
    const duplicateIngredient = await prisma.ingredient.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
        id: {
          not: id,
        },
      },
    });

    if (duplicateIngredient) {
      return NextResponse.json(
        { error: 'An ingredient with this name already exists' },
        { status: 400 }
      );
    }

    const updatedIngredient = await prisma.ingredient.update({
      where: { id },
      data: {
        name,
        description,
        unitOfMeasurement,
        reorderLevel: reorderLevel !== undefined ? reorderLevel : existingIngredient.reorderLevel,
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(updatedIngredient);
  } catch (error) {
    console.error('Error updating ingredient:', error);
    return NextResponse.json(
      { error: 'Failed to update ingredient' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Check if ingredient is used in any food items
    const usedInFoodItems = await prisma.foodItemIngredient.findMany({
      where: { ingredientId: id },
      include: {
        foodItem: {
          select: { name: true },
        },
      },
    });

    if (usedInFoodItems.length > 0) {
      const affectedItems = usedInFoodItems.map(item => item.foodItem.name);
      return NextResponse.json(
        {
          error: 'Cannot delete ingredient as it is used in food items',
          affectedItems,
        },
        { status: 400 }
      );
    }

    await prisma.ingredient.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Ingredient deleted successfully' });
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    return NextResponse.json(
      { error: 'Failed to delete ingredient' },
      { status: 500 }
    );
  }
}
