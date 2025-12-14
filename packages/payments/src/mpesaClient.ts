// M-Pesa client wrapper (sandbox-friendly stub for now).
// In production, replace the stubbed logic with real Safaricom M-Pesa API calls.

export interface MpesaC2BInitParams {
  transactionId: string;
  amount: number;
  currency: string;
  buyerPhone?: string;
}

export interface MpesaC2BInitResult {
  providerRef: string;
  instructions: string;
}

export interface MpesaB2CPayoutParams {
  transactionId: string;
  payoutId: string;
  amount: number;
  currency: string;
  recipientPhone: string;
}

export interface MpesaB2CPayoutResult {
  providerRef: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  message: string;
}

async function initiateC2BPayment(
  params: MpesaC2BInitParams,
): Promise<MpesaC2BInitResult> {
  // TODO: Implement real M-Pesa C2B integration here using Safaricom sandbox:
  // - Use consumer key/secret to obtain OAuth token.
  // - Call STK push or paybill endpoint.
  // - Handle response and return provider reference.

  // For now, return a simulated reference so the rest of the flow can be built and tested.
  const providerRef = `MPESA_SIM_${params.transactionId}_${Date.now()}`;

  return {
    providerRef,
    instructions:
      'Simulated M-Pesa C2B payment. In sandbox mode, this would trigger an STK push or provide paybill instructions.',
  };
}

async function initiateB2CPayout(
  params: MpesaB2CPayoutParams,
): Promise<MpesaB2CPayoutResult> {
  // TODO: Implement real M-Pesa B2C integration here using Safaricom sandbox:
  // - Use consumer key/secret to obtain OAuth token.
  // - Call B2C payout endpoint.
  // - Handle response and return provider reference and status.

  const providerRef = `MPESA_PAYOUT_SIM_${params.payoutId}_${Date.now()}`;

  return {
    providerRef,
    status: 'SUCCESS',
    message:
      'Simulated M-Pesa B2C payout. In sandbox mode, this would send funds to the seller\'s M-Pesa wallet.',
  };
}

module.exports = {
  initiateC2BPayment,
  initiateB2CPayout,
  MpesaC2BInitParams,
  MpesaC2BInitResult,
  MpesaB2CPayoutParams,
  MpesaB2CPayoutResult,
};
