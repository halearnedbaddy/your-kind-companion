/**
 * Paystack Payment Service
 * Handles payment collection, verification, and transfers via Paystack API
 * Documentation: https://paystack.com/docs/api/
 */

import axios, { AxiosInstance } from 'axios';

// Types for Paystack API responses
interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: 'success' | 'failed' | 'abandoned' | 'pending';
    reference: string;
    amount: number;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    customer: {
      id: number;
      email: string;
      customer_code: string;
      phone?: string;
      first_name?: string;
      last_name?: string;
    };
    authorization?: {
      authorization_code: string;
      card_type: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      bank: string;
      channel: string;
      reusable: boolean;
    };
    metadata?: Record<string, unknown>;
  };
}

interface PaystackChargeResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    status: string;
    display_text?: string;
  };
}

interface PaystackTransferRecipient {
  type: 'nuban' | 'mobile_money' | 'basa' | 'authorization';
  name: string;
  account_number: string;
  bank_code: string;
  currency: string;
}

interface PaystackTransferResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    integration: number;
    domain: string;
    amount: number;
    currency: string;
    source: string;
    reason: string;
    recipient: number;
    status: 'pending' | 'success' | 'failed' | 'reversed';
    transfer_code: string;
    reference: string;
    created_at: string;
    updated_at: string;
  };
}

interface PaystackWebhookPayload {
  event: string;
  data: {
    id: number;
    reference: string;
    amount: number;
    currency: string;
    status: string;
    gateway_response?: string;
    paid_at?: string;
    customer?: {
      email: string;
      phone?: string;
    };
    metadata?: Record<string, unknown>;
  };
}

export class PaystackService {
  private apiClient: AxiosInstance;
  private publicKey: string;
  private secretKey: string;
  private baseUrl = 'https://api.paystack.co';

  constructor() {
    this.publicKey = process.env.PAYSTACK_PUBLIC_KEY || '';
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';

    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.secretKey}`,
      },
    });

    // Log configuration status
    if (!this.secretKey) {
      console.warn('⚠️ Paystack Secret Key not configured');
    }
    if (!this.publicKey) {
      console.warn('⚠️ Paystack Public Key not configured');
    }
  }

  /**
   * Get public key for frontend use
   */
  getPublicKey(): string {
    return this.publicKey;
  }

  /**
   * Initialize a payment transaction
   * Returns a payment URL for redirect
   */
  async initializeTransaction(params: {
    email: string;
    amount: number; // Amount in kobo (NGN) or pesewas (GHS) or cents (KES)
    currency?: string;
    reference?: string;
    callbackUrl?: string;
    metadata?: Record<string, unknown>;
    channels?: string[];
  }): Promise<PaystackInitializeResponse> {
    try {
      const response = await this.apiClient.post('/transaction/initialize', {
        email: params.email,
        amount: params.amount, // Paystack expects amount in subunits (kobo/cents)
        currency: params.currency || 'KES',
        reference: params.reference,
        callback_url: params.callbackUrl,
        metadata: params.metadata,
        channels: params.channels || ['card', 'mobile_money'],
      });

      console.log('✅ Paystack transaction initialized:', response.data.data.reference);
      return response.data;
    } catch (error) {
      console.error('❌ Paystack initialization error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to initialize payment');
      }
      throw error;
    }
  }

  /**
   * Charge authorization (for repeat customers)
   */
  async chargeAuthorization(params: {
    authorizationCode: string;
    email: string;
    amount: number;
    currency?: string;
    reference?: string;
  }): Promise<PaystackChargeResponse> {
    try {
      const response = await this.apiClient.post('/transaction/charge_authorization', {
        authorization_code: params.authorizationCode,
        email: params.email,
        amount: params.amount,
        currency: params.currency || 'KES',
        reference: params.reference,
      });

      console.log('✅ Paystack charge successful:', response.data.data.reference);
      return response.data;
    } catch (error) {
      console.error('❌ Paystack charge error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to charge card');
      }
      throw error;
    }
  }

  /**
   * Verify a transaction by reference
   */
  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    try {
      const response = await this.apiClient.get(`/transaction/verify/${encodeURIComponent(reference)}`);
      console.log('✅ Paystack verification:', response.data.data.status);
      return response.data;
    } catch (error) {
      console.error('❌ Paystack verification error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to verify payment');
      }
      throw error;
    }
  }

  /**
   * Create a transfer recipient (for payouts)
   */
  async createTransferRecipient(params: {
    type: 'nuban' | 'mobile_money';
    name: string;
    accountNumber: string;
    bankCode: string;
    currency?: string;
  }): Promise<{ recipient_code: string }> {
    try {
      const response = await this.apiClient.post('/transferrecipient', {
        type: params.type,
        name: params.name,
        account_number: params.accountNumber,
        bank_code: params.bankCode,
        currency: params.currency || 'KES',
      });

      console.log('✅ Paystack recipient created:', response.data.data.recipient_code);
      return { recipient_code: response.data.data.recipient_code };
    } catch (error) {
      console.error('❌ Paystack recipient error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to create recipient');
      }
      throw error;
    }
  }

  /**
   * Initiate a transfer/payout
   */
  async initiateTransfer(params: {
    recipientCode: string;
    amount: number;
    reference?: string;
    reason?: string;
    currency?: string;
  }): Promise<PaystackTransferResponse> {
    try {
      const response = await this.apiClient.post('/transfer', {
        source: 'balance',
        recipient: params.recipientCode,
        amount: params.amount,
        reference: params.reference || `TRF-${Date.now()}`,
        reason: params.reason || 'Wallet withdrawal',
        currency: params.currency || 'KES',
      });

      console.log('✅ Paystack transfer initiated:', response.data.data.transfer_code);
      return response.data;
    } catch (error) {
      console.error('❌ Paystack transfer error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to initiate transfer');
      }
      throw error;
    }
  }

  /**
   * Get list of banks
   */
  async getBanks(country = 'kenya'): Promise<Array<{ name: string; code: string }>> {
    try {
      const response = await this.apiClient.get(`/bank?country=${country}`);
      return response.data.data.map((bank: { name: string; code: string }) => ({
        name: bank.name,
        code: bank.code,
      }));
    } catch (error) {
      console.error('❌ Paystack banks fetch error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch banks');
      }
      throw error;
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<{ currency: string; balance: number }[]> {
    try {
      const response = await this.apiClient.get('/balance');
      return response.data.data.map((b: { currency: string; balance: number }) => ({
        currency: b.currency,
        balance: b.balance / 100, // Convert from subunits
      }));
    } catch (error) {
      console.error('❌ Paystack balance error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to get balance');
      }
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(payload)
      .digest('hex');
    return hash === signature;
  }

  /**
   * Parse webhook payload
   */
  parseWebhookPayload(payload: PaystackWebhookPayload): {
    event: string;
    isSuccess: boolean;
    reference: string;
    amount: number;
    email?: string;
    metadata?: Record<string, unknown>;
  } {
    return {
      event: payload.event,
      isSuccess: payload.data.status === 'success',
      reference: payload.data.reference,
      amount: payload.data.amount / 100, // Convert from subunits
      email: payload.data.customer?.email,
      metadata: payload.data.metadata,
    };
  }

  /**
   * Generate unique reference
   */
  generateReference(prefix = 'SWL'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
}

// Export singleton instance
export const paystackService = new PaystackService();

// Export types
export type {
  PaystackInitializeResponse,
  PaystackVerifyResponse,
  PaystackChargeResponse,
  PaystackTransferResponse,
  PaystackWebhookPayload,
};
