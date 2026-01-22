import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import puppeteer from 'puppeteer';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
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

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get settings for service charge rate
    const settings = await prisma.settings.findFirst();
    const serviceChargeRate = settings?.serviceChargeRate || 0;

    // Calculate totals
    const subtotal = order.totalAmount;
    const serviceCharge = subtotal * (serviceChargeRate / 100); // Convert percentage to decimal
    const total = subtotal + serviceCharge;

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Bill #${orderId}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
              line-height: 1.6;
            }
            .header {
              background: linear-gradient(135deg, #1e40af, #1d4ed8);
              color: white;
              padding: 30px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .header-content {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .logo-section {
              display: flex;
              align-items: center;
            }
            .logo {
              width: 60px;
              height: 60px;
              background: white;
              border-radius: 8px;
              margin-right: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              color: #1e40af;
            }
            .restaurant-info h1 {
              margin: 0;
              font-size: 28px;
              font-weight: bold;
            }
            .restaurant-info p {
              margin: 5px 0 0 0;
              opacity: 0.9;
            }
            .contact-info {
              text-align: right;
              font-size: 14px;
            }
            .contact-info p {
              margin: 2px 0;
              opacity: 0.9;
            }
            .bill-details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .bill-info h2 {
              font-size: 24px;
              margin-bottom: 15px;
              color: #1f2937;
            }
            .bill-info p {
              margin: 5px 0;
              color: #4b5563;
            }
            .customer-info {
              background: #f9fafb;
              padding: 20px;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
            }
            .customer-info h3 {
              margin: 0 0 10px 0;
              color: #1f2937;
            }
            .customer-info p {
              margin: 5px 0;
              font-size: 14px;
              color: #4b5563;
            }
            .order-items {
              margin: 30px 0;
            }
            .order-items h3 {
              font-size: 18px;
              margin-bottom: 15px;
              color: #1f2937;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              background: #f9fafb;
              padding: 12px;
              text-align: left;
              border-bottom: 2px solid #e5e7eb;
              font-weight: 600;
              color: #4b5563;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #f3f4f6;
            }
            .item-name {
              font-weight: 600;
              color: #1f2937;
            }
            .item-description {
              font-size: 12px;
              color: #6b7280;
              margin-top: 2px;
            }
            .special-request {
              font-size: 12px;
              color: #2563eb;
              font-style: italic;
              margin-top: 2px;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bill-summary {
              border-top: 2px solid #e5e7eb;
              padding-top: 20px;
              margin-top: 30px;
            }
            .summary-table {
              width: 300px;
              margin-left: auto;
              border: none;
            }
            .summary-table td {
              border: none;
              padding: 8px 0;
            }
            .summary-table .total-row {
              border-top: 2px solid #1f2937;
              font-weight: bold;
              font-size: 18px;
              color: #1f2937;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-content">
              <div class="logo-section">
                <div class="logo">LOGO</div>
                <div class="restaurant-info">
                  <h1>Wokabularyg</h1>
                  <p>Fine Dining Experience</p>
                </div>
              </div>
              <div class="contact-info">
                <p>📍 49 Old Kottawa Rd, Nugegoda 10250</p>
                <p>📞 076 608 7824</p>
                <p>✉️ Wokabularylk@gmail.com</p>
              </div>
            </div>
          </div>

          <div class="bill-details">
            <div class="bill-info">
              <h2>BILL</h2>
              <p><strong>Bill #:</strong> ${order.id}</p>
              ${order.billNumber ? `<p><strong>Bill Number:</strong> ${order.billNumber}</p>` : ''}
              ${order.tableNumber ? `<p><strong>Table:</strong> ${order.tableNumber}</p>` : ''}
              <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })} at ${new Date(order.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}</p>
              <p><strong>Served by:</strong> ${order.staff.name}</p>
            </div>

            ${(order.customerName || order.customerEmail || order.customerPhone) ? `
              <div class="customer-info">
                <h3>Customer Information</h3>
                ${order.customerName ? `<p><strong>Name:</strong> ${order.customerName}</p>` : ''}
                ${order.customerEmail ? `<p><strong>Email:</strong> ${order.customerEmail}</p>` : ''}
                ${order.customerPhone ? `<p><strong>Phone:</strong> ${order.customerPhone}</p>` : ''}
              </div>
            ` : ''}
          </div>

          <div class="order-items">
            <h3>Order Details</h3>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="text-center">Portion</th>
                  <th class="text-center">Qty</th>
                  <th class="text-right">Unit Price</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.orderItems.map(item => `
                  <tr>
                    <td>
                      <div class="item-name">${item.foodItem.name}</div>
                      ${item.foodItem.description ? `<div class="item-description">${item.foodItem.description}</div>` : ''}
                      ${item.specialRequests ? `<div class="special-request">Special: ${item.specialRequests}</div>` : ''}
                    </td>
                    <td class="text-center">${item.portion.name}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">Rs. ${item.unitPrice.toFixed(2)}</td>
                    <td class="text-right">Rs. ${item.totalPrice.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          ${order.payments && order.payments.length > 0 ? `
            <div class="order-items">
              <h3>Payment Information</h3>
              ${order.payments.map(payment => `
                <div class="customer-info" style="margin-bottom: 15px;">
                  <p><strong>Payment Mode:</strong> ${payment.paymentMode}</p>
                  ${payment.referenceNumber ? `<p><strong>Reference Number:</strong> ${payment.referenceNumber}</p>` : ''}
                  <p><strong>Amount Paid:</strong> Rs. ${payment.receivedAmount.toFixed(2)}</p>
                  ${payment.balance > 0 ? `<p><strong>Balance:</strong> Rs. ${payment.balance.toFixed(2)}</p>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="bill-summary">
            <table class="summary-table">
              <tr>
                <td>Subtotal:</td>
                <td class="text-right">Rs. ${subtotal.toFixed(2)}</td>
              </tr>
              ${serviceChargeRate > 0 ? `
              <tr>
                <td>Service Charge (${serviceChargeRate}%):</td>
                <td class="text-right">Rs. ${serviceCharge.toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr class="total-row">
                <td>Total:</td>
                <td class="text-right">Rs. ${total.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="footer">
            <p>Thank you for dining with us!</p>
            <p>We hope to see you again soon.</p>
          </div>
        </body>
      </html>
    `;

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });

    await browser.close();

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="bill-${orderId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
} 