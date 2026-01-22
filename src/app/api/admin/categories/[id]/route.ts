import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Update a category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, isActive } = body;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // If disabling the category, check if it has active food items
    if (isActive === false && existingCategory.isActive === true) {
      const activeFoodItems = await prisma.foodItem.findMany({
        where: {
          categoryId: id,
          isActive: true
        },
        select: {
          name: true
        }
      });

      if (activeFoodItems.length > 0) {
        const itemNames = activeFoodItems.map(item => item.name).join(', ');
        return NextResponse.json(
          { 
            error: `Cannot disable category. It contains active food items: ${itemNames}. Please disable these items first.`,
            affectedItems: activeFoodItems.map(item => item.name)
          },
          { status: 400 }
        );
      }
    }

    // If name is being updated, check for duplicates
    if (name && name !== existingCategory.name) {
      const duplicateCategory = await prisma.category.findUnique({
        where: { name }
      });

      if (duplicateCategory) {
        return NextResponse.json(
          { error: 'Category with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Update category
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: name || existingCategory.name,
        description: description !== undefined ? description : existingCategory.description,
        isActive: isActive !== undefined ? isActive : existingCategory.isActive,
      }
    });

    return NextResponse.json({
      message: 'Category updated successfully',
      category: {
        id: updatedCategory.id,
        name: updatedCategory.name,
        description: updatedCategory.description,
        isActive: updatedCategory.isActive,
        updatedAt: updatedCategory.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        foodItems: {
          select: {
            name: true
          }
        }
      }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category has food items
    if (existingCategory.foodItems.length > 0) {
      const itemNames = existingCategory.foodItems.map(item => item.name).join(', ');
      return NextResponse.json(
        { 
          error: `Cannot delete category. It contains food items: ${itemNames}. Please reassign or delete these items first.`,
          affectedItems: existingCategory.foodItems.map(item => item.name)
        },
        { status: 400 }
      );
    }

    // Delete category
    await prisma.category.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 