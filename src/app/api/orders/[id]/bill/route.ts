import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { customerName, customerEmail, customerPhone, billNumber } = await request.json();
    const { id } = await params;
    const orderId = parseInt(id);

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'Customer email is required' },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        customerName,
        customerEmail,
        customerPhone,
      },
      include: {
        staff: {
          select: {
            name: true,
            email: true,
          },
        },
        orderItems: {
          include: {
            foodItem: {
              select: {
                name: true,
                description: true,
              },
            },
            portion: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const baseUrl = process.env.BASE_URL!;
    // Ensure baseUrl ends with a forward slash
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const billUrl = `${normalizedBaseUrl}bill/${orderId}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Your Bill - Restaurant</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0; 
              background-color: #f8f9fa;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
              background-color: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              background: linear-gradient(135deg, #2563eb, #1d4ed8);
              color: white;
              padding: 20px;
              border-radius: 8px;
              margin: -20px -20px 30px -20px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .logo { max-width: 150px; height: auto; }
            .bill-summary { 
              background: #f8f9fa; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 20px 0;
              border-left: 4px solid #2563eb;
            }
            .bill-summary h3 {
              margin-top: 0;
              color: #2563eb;
            }
            .bill-summary p {
              margin: 8px 0;
              font-size: 14px;
            }
            .bill-button { 
              display: inline-block; 
              background: #2563eb; 
              color: white !important; 
              padding: 14px 28px; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
              font-weight: bold;
              font-size: 16px;
              box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);
            }
            .bill-button:hover {
              background: #1d4ed8 !important;
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              color: #666; 
              font-size: 14px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            @media only screen and (max-width: 600px) {
              .container {
                padding: 15px !important;
                margin: 10px !important;
                border-radius: 4px !important;
              }
              .header {
                margin: -15px -15px 20px -15px !important;
                padding: 15px !important;
              }
              .header h1 {
                font-size: 20px !important;
              }
              .bill-summary {
                padding: 15px !important;
              }
              .bill-button {
                display: block !important;
                width: calc(100% - 56px) !important;
                text-align: center !important;
                box-sizing: border-box !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank you for dining with us!</h1>
            </div>
            
            <p>Dear ${customerName || 'Valued Customer'},</p>
            
            <p>Thank you for choosing our restaurant. Your bill is ready for review.</p>
            
            <div class="bill-summary">
              <h3>Order Summary</h3>
              <p><strong>Order #:</strong> ${orderId}</p>
              ${billNumber ? `<p><strong>Bill #:</strong> ${billNumber}</p>` : ''}
              <p><strong>Table:</strong> ${updatedOrder.tableNumber}</p>
              <p><strong>Total Amount:</strong> Rs. ${updatedOrder.totalAmount.toFixed(2)}</p>
              <p><strong>Served by:</strong> ${updatedOrder.staff.name}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${billUrl}" class="bill-button">View & Download Bill</a>
            </div>
            
            <p>You can view and download your detailed bill by clicking the button above.</p>
            
            <div class="footer">
              <p>We appreciate your business and look forward to serving you again!</p>
              <p>If you have any questions about your bill, please don't hesitate to contact us.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: customerEmail,
      subject: `Your Bill - Order #${orderId}${billNumber ? ` (Bill #${billNumber})` : ''}`,
      html: emailHtml,
    });

    // Send SMS if phone number is provided
    let smsResult = null;
    if (customerPhone) {
      // Check if SMS configuration is available
      if (!process.env.TEXTLK_API_TOKEN || !process.env.TEXTLK_SENDER_ID) {
        smsResult = { 
          success: false, 
          error: 'SMS configuration error: TEXTLK_API_TOKEN or TEXTLK_SENDER_ID is not configured' 
        };
      } else {
        try {
        const smsMessage = `Dear ${customerName || 'Valued Customer'},

Your bill for Order #${orderId}${billNumber ? ` (Bill #${billNumber})` : ''} is ready!

Total Amount: Rs. ${updatedOrder.totalAmount.toFixed(2)}
Table: ${updatedOrder.tableNumber}

View your bill: ${billUrl}

Thank you for dining with us!

Best Regards,
Wokabulary Team`;

        // Format phone number for Text.lk (should start with 94 for Sri Lanka)
        let formattedPhone = customerPhone;
        if (customerPhone.startsWith('+')) {
          formattedPhone = customerPhone.substring(1);
        } else if (customerPhone.startsWith('0')) {
          formattedPhone = '94' + customerPhone.substring(1);
        } else if (!customerPhone.startsWith('94')) {
          formattedPhone = '94' + customerPhone;
        }

        // Import sendSMS from textlk-node for server-side use
        const { sendSMS } = await import('textlk-node');
        
        smsResult = await sendSMS({
          phoneNumber: formattedPhone,
          message: smsMessage,
        });

        console.log('SMS Result:', smsResult);
        
        // Normalize the response structure for consistency
        if (smsResult.status === 'success') {
          smsResult = { success: true, message: smsResult.message, data: smsResult.data };
        } else {
          smsResult = { success: false, error: smsResult.message || 'SMS failed to send' };
        }
      } catch (smsError: any) {
        console.error('SMS sending failed:', smsError);
        
        // Provide more specific error messages
        let errorMessage = smsError.message || 'Unknown SMS error';
        
        if (errorMessage.includes('TEXTLK_API_TOKEN') || errorMessage.includes('not configured')) {
          errorMessage = 'SMS configuration error: TEXTLK_API_TOKEN is not configured';
        } else if (errorMessage.includes('TEXTLK_SENDER_ID')) {
          errorMessage = 'SMS configuration error: TEXTLK_SENDER_ID is not configured';
        } else if (errorMessage.includes('Invalid phone number')) {
          errorMessage = 'Invalid phone number format';
        } else if (errorMessage.includes('Insufficient balance')) {
          errorMessage = 'SMS service: Insufficient account balance';
        }
        
        smsResult = { success: false, error: errorMessage };
        }
      }
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED',
      },
    });

    return NextResponse.json({
      message: 'Bill sent successfully via email' + (customerPhone ? ' and SMS' : ''),
      billUrl,
      smsResult,
    });
  } catch (error) {
    console.error('Error sending bill:', error);
    return NextResponse.json(
      { error: 'Failed to send bill' },
      { status: 500 }
    );
  }
} 