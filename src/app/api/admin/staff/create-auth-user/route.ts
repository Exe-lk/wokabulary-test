import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Create staff user in Supabase Auth using Management API REST endpoint
// This does NOT send any emails - it directly creates the user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role } = body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, name, and role are required' },
        { status: 400 }
      );
    }

    // Validate password
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if staff member already exists
    const existingStaff = await prisma.staff.findUnique({
      where: { email }
    });

    if (existingStaff) {
      return NextResponse.json(
        { error: 'Staff member with this email already exists' },
        { status: 409 }
      );
    }

    // Use Supabase Management API REST endpoint directly
    // This method does NOT send any emails - it's a direct user creation
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    // Call Supabase Management API directly via REST
    // This endpoint creates user without triggering email notifications
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({
        email: email,
        password: password,
        email_confirm: true, // Auto-confirm email to skip verification
        user_metadata: {
          name: name,
          role: role
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to create user' }));
      console.error('Supabase user creation error:', errorData);
      return NextResponse.json(
        { error: errorData.error?.message || errorData.error || 'Failed to create user in Supabase Auth' },
        { status: response.status || 500 }
      );
    }

    const userData = await response.json();

    if (!userData || !userData.id) {
      return NextResponse.json(
        { error: 'Failed to create user - no user ID returned' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: userData.id,
        email: userData.email
      }
    });

  } catch (error) {
    console.error('Error creating auth user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
