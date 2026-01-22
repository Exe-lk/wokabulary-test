import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, role, phone, supabaseId } = body;

    // Validate required fields
    if (!name || !email || !role || !supabaseId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingStaff = await prisma.staff.findUnique({
      where: { email }
    });

    if (existingStaff) {
      return NextResponse.json(
        { error: 'Staff member with this email already exists' },
        { status: 409 }
      );
    }

    // Create staff member
    const staff = await prisma.staff.create({
      data: {
        name,
        email,
        role,
        phone: phone || null,
        supabaseId,
        isActive: true,
      }
    });

    return NextResponse.json(
      { 
        message: 'Staff member created successfully',
        staff: {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          phone: staff.phone,
          isActive: staff.isActive,
          createdAt: staff.createdAt
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating staff member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const staff = await prisma.staff.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 