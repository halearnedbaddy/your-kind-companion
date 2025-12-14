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
export declare function initiateC2BPayment(params: MpesaC2BInitParams): Promise<MpesaC2BInitResult>;
export declare function initiateB2CPayout(params: MpesaB2CPayoutParams): Promise<MpesaB2CPayoutResult>;
//# sourceMappingURL=mpesaClient.d.ts.map