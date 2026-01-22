import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

// POST /api/cashier/quick-bill - Create a quick bill without table number or kitchen status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { staffId, items, notes, customerData, paymentData, orderType } = body;

    if (!staffId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Staff ID and at least one item are required' },
        { status: 400 }
      );
    }

    if (!customerData || !customerData.name || !customerData.phone) {
      return NextResponse.json(
        { error: 'Customer name and phone are required' },
        { status: 400 }
      );
    }

    if (!paymentData) {
      return NextResponse.json(
        { error: 'Payment data is required' },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of items) {
      if (!item.foodItemId || !item.portionId || !item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Each item must have valid foodItemId, portionId, and positive quantity' },
          { status: 400 }
        );
      }
    }

    // Handle customer creation
    let customerId = null;
    if (customerData.isNewCustomer) {
      const newCustomer = await prisma.customer.create({
        data: {
          name: customerData.name,
          email: customerData.email || null,
          phone: customerData.phone,
        },
      });
      customerId = newCustomer.id;
    } else if (customerData.customerId) {
      customerId = customerData.customerId;
    } else {
      // Try to find existing customer by phone
      const existingCustomer = await prisma.customer.findUnique({
        where: { phone: customerData.phone },
      });
      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const newCustomer = await prisma.customer.create({
          data: {
            name: customerData.name,
            email: customerData.email || null,
            phone: customerData.phone,
          },
        });
        customerId = newCustomer.id;
      }
    }

    // Calculate total amount and create order with items
    let totalAmount = 0;
    const orderItemsData = [];
    const ingredientReductions = new Map();

    // Step 1: Validate each item, calculate total, and check inventory
    for (const item of items) {
      const foodItemPortion = await prisma.foodItemPortion.findFirst({
        where: {
          foodItemId: item.foodItemId,
          portionId: item.portionId,
        },
        include: {
          foodItem: true,
          portion: true,
          ingredients: {
            include: {
              ingredient: true,
            },
          },
        },
      });

      if (!foodItemPortion) {
        return NextResponse.json(
          { error: `Invalid food item and portion combination: ${item.foodItemId}, ${item.portionId}` },
          { status: 400 }
        );
      }

      if (!foodItemPortion.foodItem.isActive) {
        return NextResponse.json(
          { error: `Food item "${foodItemPortion.foodItem.name}" is currently disabled` },
          { status: 400 }
        );
      }

      if (!foodItemPortion.portion.isActive) {
        return NextResponse.json(
          { error: `Portion "${foodItemPortion.portion.name}" for "${foodItemPortion.foodItem.name}" is currently disabled` },
          { status: 400 }
        );
      }

      // Calculate ingredient requirements
      for (const portionIngredient of foodItemPortion.ingredients) {
        const requiredQuantity = portionIngredient.quantity * item.quantity;
        const ingredientId = portionIngredient.ingredientId;
        
        if (ingredientReductions.has(ingredientId)) {
          ingredientReductions.set(ingredientId, ingredientReductions.get(ingredientId) + requiredQuantity);
        } else {
          ingredientReductions.set(ingredientId, requiredQuantity);
        }
      }

      const itemTotal = foodItemPortion.price * item.quantity;
      totalAmount += itemTotal;

      orderItemsData.push({
        foodItemId: item.foodItemId,
        portionId: item.portionId,
        quantity: item.quantity,
        unitPrice: foodItemPortion.price,
        totalPrice: itemTotal,
        specialRequests: item.specialRequests || null,
      });
    }

    // Step 2: Check if there's sufficient inventory for all ingredients
    for (const [ingredientId, requiredQuantity] of ingredientReductions) {
      const ingredient = await prisma.ingredient.findUnique({
        where: { id: ingredientId },
      });

      if (!ingredient) {
        return NextResponse.json(
          { error: `Ingredient not found: ${ingredientId}` },
          { status: 400 }
        );
      }

      if (ingredient.currentStockQuantity < requiredQuantity) {
        return NextResponse.json(
          { error: `Insufficient inventory for ingredient "${ingredient.name}". Required: ${requiredQuantity} ${ingredient.unitOfMeasurement}, Available: ${ingredient.currentStockQuantity} ${ingredient.unitOfMeasurement}` },
          { status: 400 }
        );
      }
    }

    for (const [ingredientId, requiredQuantity] of ingredientReductions) {
      await prisma.ingredient.update({
        where: { id: ingredientId },
        data: {
          currentStockQuantity: {
            decrement: requiredQuantity,
          },
        },
      });
    }

    // Generate bill number
    const now = new Date();
    const dateStr = now.getFullYear().toString() + 
                   (now.getMonth() + 1).toString().padStart(2, '0') + 
                   now.getDate().toString().padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const billNumber = `BILL-${dateStr}-${randomNum}`;

    // Verify staff exists or find/create for admin
    let staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    let finalStaffId = staffId;

    // If staff not found, check if it's an admin user
    if (!staff) {
      const admin = await prisma.admin.findUnique({
        where: { id: staffId },
      });

      if (admin) {
        // Find or create a staff record for this admin
        // First try to find by email
        staff = await prisma.staff.findUnique({
          where: { email: admin.email },
        });

        // If no staff found, create one for the admin
        if (!staff) {
          // We need a supabaseId for staff, but admin doesn't have one
          // Create a dummy supabaseId or use a different approach
          // For now, let's use the admin ID as a prefix
          const dummySupabaseId = `admin_${admin.id}`;
          
          // Check if staff with this supabaseId exists
          staff = await prisma.staff.findUnique({
            where: { supabaseId: dummySupabaseId },
          });

          if (!staff) {
            // Create staff record for admin
            staff = await prisma.staff.create({
              data: {
                email: admin.email,
                name: admin.name,
                role: 'CASHIER', // Default role for admin-created bills
                supabaseId: dummySupabaseId,
                isActive: true,
              },
            });
          }
        }
        // Update finalStaffId to use the staff record
        finalStaffId = staff.id;
      } else {
        return NextResponse.json(
          { error: 'Staff member or admin not found' },
          { status: 400 }
        );
      }
    }

    // Step 4: Create the order (status COMPLETED for quick bills, no table number)
    const order = await prisma.order.create({
      data: {
        tableNumber: null as any, // Quick bills don't have table numbers
        staffId: finalStaffId,
        customerId: customerId || null,
        totalAmount,
        notes: notes || null,
        status: 'COMPLETED', // Quick bills are immediately completed
        customerName: customerData.name,
        customerEmail: customerData.email || null,
        customerPhone: customerData.phone,
        billNumber,
        orderType: orderType || 'TAKEAWAY',
      },
    });

    // Step 5: Create order items
    await prisma.orderItem.createMany({
      data: orderItemsData.map(item => ({
        ...item,
        orderId: order.id,
      })),
    });

    // Step 6: Create payment record
    if (customerId && paymentData) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          customerId: customerId,
          amount: order.totalAmount,
          receivedAmount: paymentData.receivedAmount,
          balance: paymentData.balance,
          paymentMode: paymentData.paymentMode,
          referenceNumber: paymentData.referenceNumber || null,
        },
      });
    }

    // Return the complete order with relations
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        orderItems: {
          include: {
            foodItem: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                description: true,
              },
            },
            portion: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            receivedAmount: true,
            balance: true,
            paymentDate: true,
            paymentMode: true,
            referenceNumber: true,
          },
        },
      },
    });

    // Send email and SMS if customer email/phone is provided
    let emailResult = null;
    let smsResult = null;
    const customerEmail = customerData.email || completeOrder?.customer?.email;
    const customerPhone = customerData.phone || completeOrder?.customer?.phone;
    const customerName = customerData.name || completeOrder?.customer?.name;

    // Send email if email is provided
    if (customerEmail) {
      try {
        const baseUrl = process.env.BASE_URL!;
        const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        const billUrl = `${normalizedBaseUrl}bill/${order.id}`;

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
                  <p><strong>Order #:</strong> ${order.id}</p>
                  ${billNumber ? `<p><strong>Bill #:</strong> ${billNumber}</p>` : ''}
                  <p><strong>Order Type:</strong> ${orderType || 'TAKEAWAY'}</p>
                  <p><strong>Total Amount:</strong> Rs. ${order.totalAmount.toFixed(2)}</p>
                  ${completeOrder?.staff ? `<p><strong>Served by:</strong> ${completeOrder.staff.name}</p>` : ''}
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

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: customerEmail,
          subject: `Your Bill - Order #${order.id}${billNumber ? ` (Bill #${billNumber})` : ''}`,
          html: emailHtml,
        });

        emailResult = { success: true, message: 'Email sent successfully' };
      } catch (emailError: any) {
        console.error('Error sending email:', emailError);
        emailResult = { success: false, error: emailError.message || 'Failed to send email' };
      }
    }

    // Send SMS if phone number is provided
    if (customerPhone) {
      // Check if SMS configuration is available
      if (!process.env.TEXTLK_API_TOKEN || !process.env.TEXTLK_SENDER_ID) {
        smsResult = { 
          success: false, 
          error: 'SMS configuration error: TEXTLK_API_TOKEN or TEXTLK_SENDER_ID is not configured' 
        };
      } else {
        try {
          const baseUrl = process.env.BASE_URL!;
          const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
          const billUrl = `${normalizedBaseUrl}bill/${order.id}`;

          const smsMessage = `Dear ${customerName || 'Valued Customer'},

Your bill for Order #${order.id}${billNumber ? ` (Bill #${billNumber})` : ''} is ready!

Total Amount: Rs. ${order.totalAmount.toFixed(2)}
Order Type: ${orderType || 'TAKEAWAY'}

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
          
          const smsResponse = await sendSMS({
            phoneNumber: formattedPhone,
            message: smsMessage,
          });

          console.log('SMS Result:', smsResponse);
          
          // Normalize the response structure for consistency
          if (smsResponse.status === 'success') {
            smsResult = { success: true, message: smsResponse.message, data: smsResponse.data };
          } else {
            smsResult = { success: false, error: smsResponse.message || 'SMS failed to send' };
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

    return NextResponse.json({
      ...completeOrder,
      emailResult,
      smsResult,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating quick bill:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any;
      console.error('Prisma error code:', prismaError.code);
      
      switch (prismaError.code) {
        case 'P2002':
          return NextResponse.json(
            { error: 'A record with this data already exists' },
            { status: 409 }
          );
        case 'P2003':
          return NextResponse.json(
            { error: 'Foreign key constraint failed - check if staff, customer, or items exist' },
            { status: 400 }
          );
        case 'P2025':
          return NextResponse.json(
            { error: 'Required record not found' },
            { status: 404 }
          );
        default:
          return NextResponse.json(
            { error: `Database error: ${prismaError.message || 'Unknown error'}` },
            { status: 500 }
          );
      }
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? `Server error: ${error.message}` : 'Failed to create quick bill' },
      { status: 500 }
    );
  }
}
