import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Update a portion
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, isActive } = body;

    // Check if portion exists
    const existingPortion = await prisma.portion.findUnique({
      where: { id }
    });

    if (!existingPortion) {
      return NextResponse.json(
        { error: 'Portion not found' },
        { status: 404 }
      );
    }

    // If disabling the portion, check if it's used in active food items
    if (isActive === false && existingPortion.isActive === true) {
      const activeFoodItemsUsingPortion = await prisma.foodItemPortion.findMany({
        where: {
          portionId: id,
          foodItem: {
            isActive: true
          }
        },
        include: {
          foodItem: {
            select: {
              name: true
            }
          }
        }
      });

      if (activeFoodItemsUsingPortion.length > 0) {
        const itemNames = activeFoodItemsUsingPortion.map(fip => fip.foodItem.name).join(', ');
        return NextResponse.json(
          { 
            error: `Cannot disable portion. It is currently used by active food items: ${itemNames}. Please disable these items first or remove this portion from them.`,
            affectedItems: activeFoodItemsUsingPortion.map(fip => fip.foodItem.name)
          },
          { status: 400 }
        );
      }
    }

    // If name is being updated, check for duplicates
    if (name && name !== existingPortion.name) {
      const duplicatePortion = await prisma.portion.findUnique({
        where: { name }
      });

      if (duplicatePortion) {
        return NextResponse.json(
          { error: 'Portion with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Update portion
    const updatedPortion = await prisma.portion.update({
      where: { id },
      data: {
        name: name || existingPortion.name,
        description: description !== undefined ? description : existingPortion.description,
        isActive: isActive !== undefined ? isActive : existingPortion.isActive,
      }
    });

    return NextResponse.json({
      message: 'Portion updated successfully',
      portion: {
        id: updatedPortion.id,
        name: updatedPortion.name,
        description: updatedPortion.description,
        isActive: updatedPortion.isActive,
        updatedAt: updatedPortion.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating portion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a portion
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if portion exists
    const existingPortion = await prisma.portion.findUnique({
      where: { id },
      include: {
        foodItemPortions: {
          include: {
            foodItem: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!existingPortion) {
      return NextResponse.json(
        { error: 'Portion not found' },
        { status: 404 }
      );
    }

    // Check if portion has food items
    if (existingPortion.foodItemPortions.length > 0) {
      const itemNames = existingPortion.foodItemPortions.map(fip => fip.foodItem.name).join(', ');
      return NextResponse.json(
        { 
          error: `Cannot delete portion. It is currently used by food items: ${itemNames}. Please remove this portion from these items first.`,
          affectedItems: existingPortion.foodItemPortions.map(fip => fip.foodItem.name)
        },
        { status: 400 }
      );
    }

    // Delete portion
    await prisma.portion.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Portion deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting portion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
