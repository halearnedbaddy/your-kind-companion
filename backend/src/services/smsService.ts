import axios from 'axios';

interface SMSResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Send SMS using Africa's Talking HTTP API
 */
export async function sendSMS(to: string, message: string): Promise<SMSResponse> {
  try {
    const apiKey = process.env.SMS_API_KEY;
    const username = process.env.SMS_USERNAME;

    if (!apiKey || !username) {
      console.warn('⚠️  SMS credentials not configured. Skipping SMS send.');
      
      // In development, just log the message
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 [DEV] SMS to ${to}: ${message}`);
        return { success: true, message: 'SMS sent (dev mode)' };
      }

      return { success: false, error: 'SMS service not configured' };
    }

    // Format phone number (ensure it starts with +)
    let formattedPhone = to.trim();
    if (!formattedPhone.startsWith('+')) {
      // Assume Kenyan number if no country code
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+254' + formattedPhone.substring(1);
      } else if (formattedPhone.startsWith('254')) {
        formattedPhone = '+' + formattedPhone;
      } else {
        formattedPhone = '+254' + formattedPhone;
      }
    }

    console.log(`📱 Sending SMS to ${formattedPhone}...`);

    // Africa's Talking API endpoint
    const url = 'https://api.africastalking.com/version1/messaging';

    const response = await axios.post(
      url,
      new URLSearchParams({
        username: username,
        to: formattedPhone,
        message: message,
      }),
      {
        headers: {
          'apiKey': apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
      }
    );

    console.log('📱 SMS API Response:', JSON.stringify(response.data, null, 2));

    // Check response
    const smsData = response.data?.SMSMessageData;
    if (smsData) {
      const recipients = smsData.Recipients || [];
      if (recipients.length > 0) {
        const recipient = recipients[0];
        if (recipient.status === 'Success' || recipient.statusCode === 101) {
          console.log(`✅ SMS sent to ${formattedPhone}`);
          return { success: true, message: 'SMS sent successfully' };
        } else {
          console.error('❌ SMS send failed:', recipient.status);
          return { success: false, error: recipient.status || 'SMS send failed' };
        }
      }
      
      // Check message field for success indication
      if (smsData.Message && smsData.Message.includes('Sent')) {
        console.log(`✅ SMS sent to ${formattedPhone}`);
        return { success: true, message: 'SMS sent successfully' };
      }
    }

    console.error('❌ Unexpected SMS response:', response.data);
    return { success: false, error: 'Unexpected SMS response' };
  } catch (error: any) {
    console.error('❌ Error sending SMS:', error.response?.data || error.message);
    
    // In development, don't fail on SMS errors
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 [DEV] Would send SMS to ${to}: ${message}`);
      return { success: true, message: 'SMS mocked (dev mode)' };
    }

    return {
      success: false,
      error: error.response?.data?.SMSMessageData?.Message || error.message || 'Unknown error',
    };
  }
}

/**
 * Send OTP SMS
 */
export async function sendOTPSMS(phone: string, otp: string): Promise<SMSResponse> {
  const message = `Your SWIFTLINE verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;
  return sendSMS(phone, message);
}

/**
 * Send bulk SMS
 */
export async function sendBulkSMS(recipients: Array<{ phone: string; message: string }>): Promise<SMSResponse[]> {
  const results: SMSResponse[] = [];

  for (const recipient of recipients) {
    const result = await sendSMS(recipient.phone, recipient.message);
    results.push(result);
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}
