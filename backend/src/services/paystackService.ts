import axios from 'axios';

interface VerifyResponse {
  status: boolean;
  message: string;
  data: {
    status: string;
    reference: string;
    amount: number;
    gateway_response: string;
    paid_at: string;
    channel: string;
    currency: string;
    metadata?: any;
    // Add other fields as needed
  };
}

export const paystackService = {
  async verifyTransaction(reference: string): Promise<VerifyResponse | null> {
    try {
      const secretKey = process.env.PAYSTACK_SECRET_KEY;

      if (!secretKey) {
        console.error('PAYSTACK_SECRET_KEY is not defined');
        throw new Error('Server configuration error');
      }

      const response = await axios.get<VerifyResponse>(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Paystack verification error:', error);
      return null;
    }
  },
};
