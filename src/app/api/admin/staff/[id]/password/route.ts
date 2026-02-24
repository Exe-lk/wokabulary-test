import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Update staff password using Supabase REST API directly
// This bypasses all email notifications by using the Management API endpoint
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { password } = body;

    // Validate password
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

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

    // Use Supabase Management API REST endpoint directly
    // This method does NOT send any emails - it's a direct password update
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    // Call Supabase Management API directly via REST
    // This endpoint updates password without triggering email notifications
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${existingStaff.supabaseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({
        password: password
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to update password' }));
      console.error('Supabase password update error:', errorData);
      return NextResponse.json(
        { error: errorData.error?.message || errorData.error || 'Failed to update password' },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json({
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Error updating password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
