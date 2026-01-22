import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/waiter/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableNumber, staffId, items, notes, customerData, paymentData } = body;

    if (!tableNumber || !staffId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Table number, staff ID, and at least one item are required' },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of items) {
      if (!item.foodItemId || !item.portionId || !item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Each item must have valid foodItemId, portionId, and positive quantity' },
          { status: 400 }
        );
      }
    }

    // Handle customer creation outside transaction first if needed
    let customerId = null;
    if (customerData && customerData.isNewCustomer) {
      const newCustomer = await prisma.customer.create({
        data: {
          name: customerData.name,
          email: customerData.email || null,
          phone: customerData.phone,
        },
      });
      customerId = newCustomer.id;
    } else if (customerData) {
      customerId = customerData.customerId;
    }

    // Calculate total amount and create order with items (serverless-friendly approach)
    let totalAmount = 0;
    const orderItemsData = [];
    const ingredientReductions = new Map(); // Track ingredient quantity reductions

    // Step 1: Validate each item, calculate total, and check inventory
    for (const item of items) {
      const foodItemPortion = await prisma.foodItemPortion.findFirst({
        where: {
          foodItemId: item.foodItemId,
          portionId: item.portionId,
        },
        include: {
          foodItem: true,
          portion: true,
          ingredients: {
            include: {
              ingredient: true,
            },
          },
        },
      });

      if (!foodItemPortion) {
        return NextResponse.json(
          { error: `Invalid food item and portion combination: ${item.foodItemId}, ${item.portionId}` },
          { status: 400 }
        );
      }

      // Check if food item is active
      if (!foodItemPortion.foodItem.isActive) {
        return NextResponse.json(
          { error: `Food item "${foodItemPortion.foodItem.name}" is currently disabled and cannot be ordered` },
          { status: 400 }
        );
      }

      // Check if portion is active
      if (!foodItemPortion.portion.isActive) {
        return NextResponse.json(
          { error: `Portion "${foodItemPortion.portion.name}" for "${foodItemPortion.foodItem.name}" is currently disabled` },
          { status: 400 }
        );
      }

      // Calculate ingredient requirements for this order item
      for (const portionIngredient of foodItemPortion.ingredients) {
        const requiredQuantity = portionIngredient.quantity * item.quantity;
        const ingredientId = portionIngredient.ingredientId;
        
        // Add to total required quantity for this ingredient
        if (ingredientReductions.has(ingredientId)) {
          ingredientReductions.set(ingredientId, ingredientReductions.get(ingredientId) + requiredQuantity);
        } else {
          ingredientReductions.set(ingredientId, requiredQuantity);
        }
      }

      const itemTotal = foodItemPortion.price * item.quantity;
      totalAmount += itemTotal;

      orderItemsData.push({
        foodItemId: item.foodItemId,
        portionId: item.portionId,
        quantity: item.quantity,
        unitPrice: foodItemPortion.price,
        totalPrice: itemTotal,
        specialRequests: item.specialRequests || null,
      });
    }

    // Step 2: Check if there's sufficient inventory for all ingredients
    for (const [ingredientId, requiredQuantity] of ingredientReductions) {
      const ingredient = await prisma.ingredient.findUnique({
        where: { id: ingredientId },
      });

      if (!ingredient) {
        return NextResponse.json(
          { error: `Ingredient not found: ${ingredientId}` },
          { status: 400 }
        );
      }

      if (ingredient.currentStockQuantity < requiredQuantity) {
        return NextResponse.json(
          { error: `Insufficient inventory for ingredient "${ingredient.name}". Required: ${requiredQuantity} ${ingredient.unitOfMeasurement}, Available: ${ingredient.currentStockQuantity} ${ingredient.unitOfMeasurement}` },
          { status: 400 }
        );
      }
    }

    // Step 3: Reduce ingredient stock
    for (const [ingredientId, requiredQuantity] of ingredientReductions) {
      await prisma.ingredient.update({
        where: { id: ingredientId },
        data: {
          currentStockQuantity: {
            decrement: requiredQuantity,
          },
        },
      });
    }

    // Step 4: Create the order
    const order = await prisma.order.create({
      data: {
        tableNumber,
        staffId,
        customerId,
        totalAmount,
        notes: notes || null,
        status: 'PENDING',
        customerName: customerData?.name || null,
        customerEmail: customerData?.email || null,
        customerPhone: customerData?.phone || null,
      },
    });

    // Step 5: Create order items
    await prisma.orderItem.createMany({
      data: orderItemsData.map(item => ({
        ...item,
        orderId: order.id,
      })),
    });

    // Create payment record if payment data is provided
    if (paymentData && customerId) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          customerId: customerId,
          amount: order.totalAmount,
          receivedAmount: paymentData.receivedAmount,
          balance: paymentData.balance,
          paymentMode: paymentData.paymentMode,
          referenceNumber: paymentData.referenceNumber || null,
        },
      });
    }

    // Return the complete order with relations
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        orderItems: {
          include: {
            foodItem: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
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
        payments: {
          select: {
            id: true,
            amount: true,
            receivedAmount: true,
            balance: true,
            paymentDate: true,
          },
        },
      },
    });

    return NextResponse.json(completeOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    
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
            { error: 'Foreign key constraint failed - check if staff, customer, or items exist' },
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
    
    // Check if it's a database connection error
    if (error instanceof Error && (error.message.includes('DATABASE_URL') || error.message.includes('connect'))) {
      return NextResponse.json({ 
        error: 'Database connection failed - check your environment variables' 
      }, { status: 500 });
    }
    
    // Check if it's a transaction error
    if (error instanceof Error && error.message.includes('Transaction')) {
      return NextResponse.json({ 
        error: 'Order processing failed - please try again' 
      }, { status: 500 });
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? `Server error: ${error.message}` : 'Failed to create order' },
      { status: 500 }
    );
  }
}

// GET /api/waiter/orders - Get orders for a staff member
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');
    const status = searchParams.get('status');

    if (!staffId) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      );
    }

    const whereClause: any = { staffId };
    if (status) {
      whereClause.status = status;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        orderItems: {
          include: {
            foodItem: true,
            portion: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return NextResponse.json({ 
        error: 'Database connection not configured. Please check your DATABASE_URL environment variable.' 
      }, { status: 500 });
    }
    
    // Check if it's a Prisma client error
    if (error instanceof Error && error.message.includes('prisma')) {
      return NextResponse.json({ 
        error: 'Database client error. Please ensure the database is running and accessible.' 
      }, { status: 500 });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
} 