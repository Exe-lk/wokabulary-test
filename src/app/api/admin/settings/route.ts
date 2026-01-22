import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';

// GET /api/admin/settings - Get current settings
export async function GET() {
  try {
    // Get the first settings record (there should only be one)
    let settings = await prisma.settings.findFirst();
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          serviceChargeRate: 0.0,
          theme: "blue"
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Update settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceChargeRate, theme } = body;

    // Validate input
    if (serviceChargeRate !== undefined && (typeof serviceChargeRate !== 'number' || serviceChargeRate < 0 || serviceChargeRate > 100)) {
      return NextResponse.json(
        { error: "Service charge rate must be a number between 0 and 100" },
        { status: 400 }
      );
    }

    if (theme !== undefined && !['blue', 'green', 'purple', 'red', 'yellow', 'indigo'].includes(theme)) {
      return NextResponse.json(
        { error: "Invalid theme. Allowed themes: blue, green, purple, red, yellow, indigo" },
        { status: 400 }
      );
    }

    // Get existing settings or create if none exist
    let settings = await prisma.settings.findFirst();
    
    if (!settings) {
      // Create new settings
      settings = await prisma.settings.create({
        data: {
          serviceChargeRate: serviceChargeRate ?? 0.0,
          theme: theme ?? "blue"
        }
      });
    } else {
      // Update existing settings
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          ...(serviceChargeRate !== undefined && { serviceChargeRate }),
          ...(theme !== undefined && { theme }),
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
} 