import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Update a food item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, imageUrl, categoryId, portions, isActive } = body;

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

    // If disabling the food item, check if it's used in incomplete orders
    if (isActive === false && existingItem.isActive === true) {
      const incompleteOrders = await prisma.orderItem.findMany({
        where: {
          foodItemId: id,
          order: {
            status: {
              not: 'COMPLETED'
            }
          }
        },
        include: {
          order: {
            select: {
              id: true,
              status: true,
              tableNumber: true,
              createdAt: true
            }
          }
        }
      });

      if (incompleteOrders.length > 0) {
        const orderDetails = incompleteOrders.map(oi => 
          `Order #${oi.order.id} (Table ${oi.order.tableNumber}, Status: ${oi.order.status})`
        ).join(', ');
        
        return NextResponse.json(
          { 
            error: `Cannot disable food item. It is part of incomplete orders: ${orderDetails}. Please complete or cancel these orders first.`,
            affectedOrders: incompleteOrders.map(oi => ({
              orderId: oi.order.id,
              tableNumber: oi.order.tableNumber,
              status: oi.order.status,
              createdAt: oi.order.createdAt
            }))
          },
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
      }

      // Delete existing portions
      await prisma.foodItemPortion.deleteMany({
        where: { foodItemId: id }
      });

      // Create new portions
      await prisma.foodItemPortion.createMany({
        data: portions.map(portion => ({
          foodItemId: id,
          portionId: portion.portionId,
          price: parseFloat(portion.price)
        }))
      });
    }

    // Step 3: Return the complete food item with relations
    const foodItem = await prisma.foodItem.findUnique({
      where: { id },
      include: {
        category: true,
        foodItemPortions: {
          include: {
            portion: true
          },
          orderBy: {
            price: 'asc'
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Food item updated successfully',
      foodItem
    });
  } catch (error) {
    console.error('Error updating food item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a food item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if food item exists
    const existingItem = await prisma.foodItem.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            order: {
              select: {
                id: true,
                status: true,
                tableNumber: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Food item not found' },
        { status: 404 }
      );
    }

    // Check if food item is used in any orders
    if (existingItem.orderItems.length > 0) {
      const orderDetails = existingItem.orderItems.map(oi => 
        `Order #${oi.order.id} (Table ${oi.order.tableNumber}, Status: ${oi.order.status})`
      ).join(', ');
      
      return NextResponse.json(
        { 
          error: `Cannot delete food item. It is part of existing orders: ${orderDetails}. Food items with order history cannot be deleted to maintain data integrity.`,
          affectedOrders: existingItem.orderItems.map(oi => ({
            orderId: oi.order.id,
            tableNumber: oi.order.tableNumber,
            status: oi.order.status,
            createdAt: oi.order.createdAt
          }))
        },
        { status: 400 }
      );
    }

    // Delete food item (cascade will handle food item portions)
    await prisma.foodItem.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Food item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting food item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}