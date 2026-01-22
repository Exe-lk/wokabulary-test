#!/usr/bin/env node

/**
 * Test script for SMS functionality using textlk-nextjs
 * Run this script to test your Text.lk SMS configuration
 */

const { sendSMS } = require('textlk-node');

async function testSMS() {
  console.log('🧪 Testing SMS functionality with Text.lk...\n');

  // Check if environment variables are set
  if (!process.env.TEXTLK_API_TOKEN) {
    console.error('❌ TEXTLK_API_TOKEN is not set in environment variables');
    console.log('Please add TEXTLK_API_TOKEN to your .env.local file');
    return;
  }

  if (!process.env.TEXTLK_SENDER_ID) {
    console.error('❌ TEXTLK_SENDER_ID is not set in environment variables');
    console.log('Please add TEXTLK_SENDER_ID to your .env.local file');
    return;
  }

  console.log('✅ Environment variables found:');
  console.log(`   API Token: ${process.env.TEXTLK_API_TOKEN.substring(0, 10)}...`);
  console.log(`   Sender ID: ${process.env.TEXTLK_SENDER_ID}\n`);

  // Test phone number (replace with your actual test number)
  const testPhoneNumber = process.env.TEST_PHONE_NUMBER || '94710000000';
  const testMessage = `🧪 Test SMS from Wokabulary POS System

This is a test message to verify SMS functionality.

Order #: TEST-001
Bill #: BILL-20241201-0001
Total: Rs. 1,250.00

Thank you for testing!
- Restaurant Team`;

  console.log('📱 Sending test SMS...');
  console.log(`   To: ${testPhoneNumber}`);
  console.log(`   Message: ${testMessage.substring(0, 100)}...\n`);

  try {
    const result = await sendSMS({
      phoneNumber: testPhoneNumber,
      message: testMessage,
    });

    if (result.status === 'success') {
      console.log('✅ SMS sent successfully!');
      console.log('   Response:', result);
      console.log('   Message ID:', result.data?.uid);
      console.log('   Cost:', result.data?.cost);
      console.log('   SMS Count:', result.data?.sms_count);
    } else {
      console.error('❌ SMS failed to send');
      console.error('   Error:', result.message || result.error);
    }
  } catch (error) {
    console.error('❌ Error sending SMS:', error.message);
  }
}

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Run the test
testSMS().catch(console.error);
