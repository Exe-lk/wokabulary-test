import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/portions - Get all portions
export async function GET() {
  try {
    const portions = await prisma.portion.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(portions);
  } catch (error) {
    console.error('Error fetching portions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portions' },
      { status: 500 }
    );
  }
}

// POST /api/admin/portions - Create a new portion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Portion name is required' },
        { status: 400 }
      );
    }

    // Trim the name and validate length
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      return NextResponse.json(
        { error: 'Portion name must be at least 2 characters long' },
        { status: 400 }
      );
    }

    if (trimmedName.length > 50) {
      return NextResponse.json(
        { error: 'Portion name must be less than 50 characters' },
        { status: 400 }
      );
    }

    // Check if portion with same name already exists (case-insensitive)
    const existingPortion = await prisma.portion.findFirst({
      where: { 
        name: {
          equals: trimmedName,
          mode: 'insensitive'
        }
      }
    });

    if (existingPortion) {
      return NextResponse.json(
        { error: `Portion with name "${trimmedName}" already exists. Please choose a different name.` },
        { status: 400 }
      );
    }

    const portion = await prisma.portion.create({
      data: {
        name: trimmedName,
        description: description ? description.trim() : null,
      }
    });

    return NextResponse.json(portion, { status: 201 });
  } catch (error) {
    console.error('Error creating portion:', error);
    return NextResponse.json(
      { error: 'Failed to create portion' },
      { status: 500 }
    );
  }
} 