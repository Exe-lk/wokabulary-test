import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Update a customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, phone } = body;

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id }
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    // If phone is being updated, check for duplicates
    if (phone && phone !== existingCustomer.phone) {
      const duplicateCustomer = await prisma.customer.findUnique({
        where: { phone }
      });

      if (duplicateCustomer) {
        return NextResponse.json(
          { error: 'Customer with this phone number already exists' },
          { status: 409 }
        );
      }
    }

    // Update customer
    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        name,
        email: email || null,
        phone,
      }
    });

    return NextResponse.json({
      message: 'Customer updated successfully',
      customer: updatedCustomer
    });

  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          select: {
            id: true,
            status: true,
            tableNumber: true,
            createdAt: true,
            totalAmount: true
          }
        }
      }
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check if customer has any orders
    if (existingCustomer.orders.length > 0) {
      const orderDetails = existingCustomer.orders.map(order => 
        `Order #${order.id} (Table ${order.tableNumber}, Status: ${order.status}, Amount: Rs. ${order.totalAmount})`
      ).join(', ');
      
      return NextResponse.json(
        { 
          error: `Cannot delete customer. They have existing orders: ${orderDetails}. Customers with order history cannot be deleted to maintain data integrity.`,
          affectedOrders: existingCustomer.orders.map(order => ({
            orderId: order.id,
            tableNumber: order.tableNumber,
            status: order.status,
            createdAt: order.createdAt,
            totalAmount: order.totalAmount
          }))
        },
        { status: 400 }
      );
    }

    // Delete customer
    await prisma.customer.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Customer deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

