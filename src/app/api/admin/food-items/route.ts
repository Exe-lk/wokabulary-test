import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/food-items - Get all food items with portion and category details
export async function GET() {
  try {
    const foodItems = await prisma.foodItem.findMany({
      include: {
        category: true,
        foodItemPortions: {
          include: {
            portion: true,
            ingredients: {
              include: {
                ingredient: true
              }
            }
          },
          orderBy: {
            price: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(foodItems);
  } catch (error) {
    console.error('Error fetching food items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch food items' },
      { status: 500 }
    );
  }
}

// POST /api/admin/food-items - Create a new food item with multiple portions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, imageUrl, categoryId, portions } = body;

    if (!name || !categoryId || !portions || !Array.isArray(portions) || portions.length === 0) {
      return NextResponse.json(
        { error: 'Name, category, and at least one portion with price are required' },
        { status: 400 }
      );
    }

    // Validate portions array
    for (const portion of portions) {
      if (!portion.portionId || !portion.price || portion.price <= 0) {
        return NextResponse.json(
          { error: 'Each portion must have a valid portionId and positive price' },
          { status: 400 }
        );
      }
      
      // Validate that each ingredient has required fields (if ingredients are provided)
      if (portion.ingredients && Array.isArray(portion.ingredients) && portion.ingredients.length > 0) {
        for (const ingredient of portion.ingredients) {
          if (!ingredient.ingredientId || !ingredient.quantity || ingredient.quantity <= 0) {
            return NextResponse.json(
              { error: 'Each ingredient must have a valid ingredientId and positive quantity' },
              { status: 400 }
            );
          }
        }
      }
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Selected category does not exist' },
        { status: 400 }
      );
    }

    // Check if all ingredients exist (if provided)
    const allIngredientIds = [...new Set(portions
      .flatMap(p => p.ingredients || [])
      .map((ing: any) => ing.ingredientId)
      .filter(Boolean))];
    
    if (allIngredientIds.length > 0) {
      const existingIngredients = await prisma.ingredient.findMany({
        where: { id: { in: allIngredientIds } }
      });

      if (existingIngredients.length !== allIngredientIds.length) {
        return NextResponse.json(
          { error: 'One or more selected ingredients do not exist' },
          { status: 400 }
        );
      }
    }

    // Create food item with portions and ingredients (serverless-friendly approach)
    // Step 1: Create the food item first
    const newFoodItem = await prisma.foodItem.create({
      data: {
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        categoryId,
      }
    });

    // Step 2: Create food item portions and their ingredients
    for (const portion of portions) {
      const foodItemPortion = await prisma.foodItemPortion.create({
        data: {
          foodItemId: newFoodItem.id,
          portionId: portion.portionId,
          price: parseFloat(portion.price)
        }
      });

      // Create ingredients for this portion if provided
      if (portion.ingredients && Array.isArray(portion.ingredients) && portion.ingredients.length > 0) {
        const validIngredients = portion.ingredients.filter((ing: any) => ing.ingredientId && ing.quantity && ing.quantity > 0);
        
        if (validIngredients.length > 0) {
          await prisma.foodItemPortionIngredient.createMany({
            data: validIngredients.map((ingredient: any) => ({
              foodItemPortionId: foodItemPortion.id,
              ingredientId: ingredient.ingredientId,
              quantity: parseFloat(ingredient.quantity)
            }))
          });
        }
      }
    }

    // Step 3: Fetch the complete food item with relations
    const foodItem = await prisma.foodItem.findUnique({
      where: { id: newFoodItem.id },
      include: {
        category: true,
        foodItemPortions: {
          include: {
            portion: true,
            ingredients: {
              include: {
                ingredient: true
              }
            }
          },
          orderBy: {
            price: 'asc'
          }
        }
      }
    });

    return NextResponse.json(foodItem, { status: 201 });
  } catch (error) {
    console.error('Error creating food item:', error);
    
    // Enhanced error logging for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Check for specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any;
      console.error('Prisma error code:', prismaError.code);
      console.error('Prisma error meta:', prismaError.meta);
      
      // Handle specific Prisma error codes
      switch (prismaError.code) {
        case 'P2002':
          return NextResponse.json(
            { error: 'A record with this data already exists' },
            { status: 409 }
          );
        case 'P2003':
          return NextResponse.json(
            { error: 'Foreign key constraint failed - check if category or portions exist' },
            { status: 400 }
          );
        case 'P2025':
          return NextResponse.json(
            { error: 'Required record not found' },
            { status: 404 }
          );
        case 'P1001':
          return NextResponse.json(
            { error: 'Database connection failed - check DATABASE_URL' },
            { status: 500 }
          );
        default:
          return NextResponse.json(
            { error: `Database error: ${prismaError.message || 'Unknown error'}` },
            { status: 500 }
          );
      }
    }
    
    // Check for database connection issues
    if (error instanceof Error && error.message.includes('connect')) {
      return NextResponse.json(
        { error: 'Database connection failed - check your environment variables' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? `Server error: ${error.message}` : 'Failed to create food item' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/food-items - Update a food item
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, imageUrl, categoryId, portions, isActive } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Food item ID is required' },
        { status: 400 }
      );
    }

    // Check if food item exists
    const existingItem = await prisma.foodItem.findUnique({
      where: { id }
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Food item not found' },
        { status: 404 }
      );
    }

    // Check if all ingredients exist (if provided)
    const allIngredientIds: string[] = [...new Set(portions
      ?.flatMap((p: any) => p.ingredients || [])
      .map((ing: any) => ing.ingredientId)
      .filter(Boolean) || [])] as string[];
    
    if (allIngredientIds.length > 0) {
      const existingIngredients = await prisma.ingredient.findMany({
        where: { id: { in: allIngredientIds } }
      });

      if (existingIngredients.length !== allIngredientIds.length) {
        return NextResponse.json(
          { error: 'One or more selected ingredients do not exist' },
          { status: 400 }
        );
      }
    }

    // Update food item (serverless-friendly approach)
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Step 1: Update the food item
    const updatedFoodItem = await prisma.foodItem.update({
      where: { id },
      data: updateData
    });

    // Step 2: If portions are provided, update them
    if (portions && Array.isArray(portions) && portions.length > 0) {
      // Validate portions
      for (const portion of portions) {
        if (!portion.portionId || !portion.price || portion.price <= 0) {
          return NextResponse.json(
            { error: 'Each portion must have a valid portionId and positive price' },
            { status: 400 }
          );
        }
        
        // Validate that each ingredient has required fields (if ingredients are provided)
        if (portion.ingredients && Array.isArray(portion.ingredients) && portion.ingredients.length > 0) {
          for (const ingredient of portion.ingredients) {
            if (!ingredient.ingredientId || !ingredient.quantity || ingredient.quantity <= 0) {
              return NextResponse.json(
                { error: 'Each ingredient must have a valid ingredientId and positive quantity' },
                { status: 400 }
              );
            }
          }
        }
      }

      // Delete existing portions (cascade will handle ingredients)
      await prisma.foodItemPortion.deleteMany({
        where: { foodItemId: id }
      });

      // Create new portions with ingredients
      for (const portion of portions) {
        const foodItemPortion = await prisma.foodItemPortion.create({
          data: {
            foodItemId: id,
            portionId: portion.portionId,
            price: parseFloat(portion.price)
          }
        });

        // Create ingredients for this portion if provided
        if (portion.ingredients && Array.isArray(portion.ingredients) && portion.ingredients.length > 0) {
          const validIngredients = portion.ingredients.filter((ing: any) => ing.ingredientId && ing.quantity && ing.quantity > 0);
          
          if (validIngredients.length > 0) {
            await prisma.foodItemPortionIngredient.createMany({
              data: validIngredients.map((ingredient: any) => ({
                foodItemPortionId: foodItemPortion.id,
                ingredientId: ingredient.ingredientId,
                quantity: parseFloat(ingredient.quantity)
              }))
            });
          }
        }
      }
    }

    // Step 3: Return the complete food item with relations
    const foodItem = await prisma.foodItem.findUnique({
      where: { id },
      include: {
        category: true,
        foodItemPortions: {
          include: {
            portion: true,
            ingredients: {
              include: {
                ingredient: true
              }
            }
          },
          orderBy: {
            price: 'asc'
          }
        }
      }
    });

    return NextResponse.json(foodItem);
  } catch (error) {
    console.error('Error updating food item:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update food item' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/food-items/[id] - Delete a food item
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Food item ID is required' },
        { status: 400 }
      );
    }

    // Check if food item exists
    const existingItem = await prisma.foodItem.findUnique({
      where: { id }
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Food item not found' },
        { status: 404 }
      );
    }

    // Delete food item (cascade will handle food item portions)
    await prisma.foodItem.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Food item deleted successfully' });
  } catch (error) {
    console.error('Error deleting food item:', error);
    return NextResponse.json(
      { error: 'Failed to delete food item' },
      { status: 500 }
    );
  }
} 