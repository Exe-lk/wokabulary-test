import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';

// GET /api/settings - Get current settings (public access)
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