import axios from 'axios';

interface SMSResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Send SMS using Bulk SMS Kenya (AdvantaSMS/TextSMS pattern)
 */
export async function sendSMS(to: string, message: string): Promise<SMSResponse> {
  try {
    const apiKey = process.env.BULK_SMS_API_KEY;
    const partnerID = '7810'; // Default partner ID for this provider
    const senderId = 'XpressKard';

    if (!apiKey) {
      console.warn('⚠️  BULK_SMS_API_KEY not configured. Skipping SMS send.');
      
      // In development, just log the message
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 [DEV] SMS to ${to}: ${message}`);
        return { success: true, message: 'SMS sent (dev mode)' };
      }

      return { success: false, error: 'SMS service not configured' };
    }

    // Format phone number (ensure it is 254...)
    let formattedPhone = to.trim().replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
      formattedPhone = '254' + formattedPhone;
    } else if (!formattedPhone.startsWith('254')) {
      // If it's something else, we might need a more robust check, but this is standard for KE
      formattedPhone = '254' + formattedPhone;
    }

    console.log(`📱 Sending SMS to ${formattedPhone} via Bulk SMS Kenya...`);

    // Provider endpoint (AdvantaSMS/TextSMS Kenya)
    const url = 'https://quicksms.advantasms.com/api/services/sendsms/';

    const response = await axios.post(url, {
      apikey: apiKey,
      partnerID: partnerID,
      message: message,
      shortcode: senderId,
      mobile: formattedPhone
    });

    console.log('📱 SMS API Response:', JSON.stringify(response.data, null, 2));

    // Response pattern for this provider usually includes "responses" array or success indicators
    // Check for success code 200 or similar based on typical provider responses
    if (response.data && (response.data.response_code === 200 || response.data.success === true || response.status === 200)) {
      console.log(`✅ SMS sent to ${formattedPhone}`);
      return { success: true, message: 'SMS sent successfully' };
    }

    return { success: false, error: response.data?.message || 'SMS send failed' };
  } catch (error: any) {
    console.error('❌ Error sending SMS:', error.response?.data || error.message);
    
    // In development, don't fail on SMS errors
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 [DEV] Would send SMS to ${to}: ${message}`);
      return { success: true, message: 'SMS mocked (dev mode)' };
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Unknown error',
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
