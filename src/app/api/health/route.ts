import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    let errorMessage = 'Database connection failed';
    let errorDetails = '';
    
    if (error instanceof Error) {
      if (error.message.includes('DATABASE_URL')) {
        errorMessage = 'Database URL not configured';
        errorDetails = 'Please check your DATABASE_URL environment variable';
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Database server not accessible';
        errorDetails = 'Please ensure your database server is running';
      } else if (error.message.includes('authentication')) {
        errorMessage = 'Database authentication failed';
        errorDetails = 'Please check your database credentials';
      } else {
        errorDetails = error.message;
      }
    }
    
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
