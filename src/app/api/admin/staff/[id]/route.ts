import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Update a staff member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, role, phone, isActive } = body;

    // Check if staff member exists
    const existingStaff = await prisma.staff.findUnique({
      where: { id }
    });

    if (!existingStaff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Name, email, and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['WAITER', 'KITCHEN', 'MANAGER', 'CASHIER'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: ' + validRoles.join(', ') },
        { status: 400 }
      );
    }

    // If email is being updated, check for duplicates
    if (email && email !== existingStaff.email) {
      const duplicateStaff = await prisma.staff.findUnique({
        where: { email }
      });

      if (duplicateStaff) {
        return NextResponse.json(
          { error: 'Staff member with this email already exists' },
          { status: 409 }
        );
      }
    }

    // If deactivating the staff, check if they have orders assigned
    if (isActive === false && existingStaff.isActive === true) {
      const activeOrders = await prisma.order.findMany({
        where: {
          staffId: id,
          status: {
            notIn: ['COMPLETED', 'CANCELLED']
          }
        },
        select: {
          id: true,
          status: true,
          tableNumber: true,
          createdAt: true
        }
      });

      if (activeOrders.length > 0) {
        const orderDetails = activeOrders.map(order => 
          `Order #${order.id} (Table ${order.tableNumber}, Status: ${order.status})`
        ).join(', ');
        
        return NextResponse.json(
          { 
            error: `Cannot deactivate staff member. They have active orders: ${orderDetails}. Please complete or reassign these orders first.`,
            affectedOrders: activeOrders.map(order => ({
              orderId: order.id,
              tableNumber: order.tableNumber,
              status: order.status,
              createdAt: order.createdAt
            }))
          },
          { status: 400 }
        );
      }
    }

    // Update staff member
    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: {
        name,
        email,
        role,
        phone: phone || null,
        isActive: isActive !== undefined ? isActive : existingStaff.isActive,
      }
    });

    return NextResponse.json({
      message: 'Staff member updated successfully',
      staff: {
        id: updatedStaff.id,
        name: updatedStaff.name,
        email: updatedStaff.email,
        role: updatedStaff.role,
        phone: updatedStaff.phone,
        isActive: updatedStaff.isActive,
        createdAt: updatedStaff.createdAt,
        updatedAt: updatedStaff.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if staff member exists
    const existingStaff = await prisma.staff.findUnique({
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

    if (!existingStaff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Check if staff member has any orders (for data integrity)
    if (existingStaff.orders.length > 0) {
      const orderDetails = existingStaff.orders.map(order => 
        `Order #${order.id} (Table ${order.tableNumber}, Status: ${order.status})`
      ).join(', ');
      
      return NextResponse.json(
        { 
          error: `Cannot delete staff member. They have existing orders: ${orderDetails}. Staff members with order history cannot be deleted to maintain data integrity.`,
          affectedOrders: existingStaff.orders.map(order => ({
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

    // Delete staff member
    await prisma.staff.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Staff member deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

