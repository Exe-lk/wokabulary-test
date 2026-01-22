import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get current staff member
    const currentStaff = await prisma.staff.findUnique({
      where: { id }
    });

    if (!currentStaff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Toggle the status
    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: { isActive: !currentStaff.isActive }
    });

    return NextResponse.json({
      message: `Staff member ${updatedStaff.isActive ? 'activated' : 'deactivated'} successfully`,
      staff: {
        id: updatedStaff.id,
        name: updatedStaff.name,
        email: updatedStaff.email,
        role: updatedStaff.role,
        isActive: updatedStaff.isActive,
        updatedAt: updatedStaff.updatedAt
      }
    });

  } catch (error) {
    console.error('Error toggling staff status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 