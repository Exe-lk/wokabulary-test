import { NextRequest, NextResponse } from 'next/server';
import { sendSMS, type SMSParams, type SMSResponse } from 'textlk-node';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json();

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Check if environment variables are set
    if (!process.env.TEXTLK_API_TOKEN) {
      return NextResponse.json(
        { error: 'TEXTLK_API_TOKEN is not configured' },
        { status: 500 }
      );
    }

    if (!process.env.TEXTLK_SENDER_ID) {
      return NextResponse.json(
        { error: 'TEXTLK_SENDER_ID is not configured' },
        { status: 500 }
      );
    }

    // Send SMS using textlk-nextjs
    const result = await sendSMS({
      phoneNumber,
      message,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'SMS sent successfully',
        data: result,
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to send SMS',
          details: result.error 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
