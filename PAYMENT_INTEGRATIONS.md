# Payment Integrations - M-Pesa Implementation Guide

This document explains the M-Pesa payment integration architecture, implementation details, and how to complete the integration for the Paying-zee escrow platform.

## Overview

Paying-zee uses Safaricom M-Pesa for two main payment flows:
1. **C2B (Customer-to-Business)**: Buyers deposit funds into escrow
2. **B2C (Business-to-Customer)**: Sellers receive payouts from escrow

## Current Implementation Status

### ✅ Completed
- Stub implementations for both C2B and B2C flows
- API endpoints that call the payment functions
- Webhook endpoint structure for M-Pesa callbacks
- Database models to track payment references and statuses

### ⚠️ Needs Implementation
- Real Safaricom API integration
- OAuth token management
- Webhook signature validation
- Error handling and retries
- Payment reconciliation

---

## 1. M-Pesa C2B (Customer-to-Business) Integration

### 1.1 What is C2B?

C2B allows customers (buyers) to send money to your business account. In Paying-zee:
- Buyer initiates payment for a transaction
- Funds are deposited into escrow
- Transaction status changes from `PENDING` → `ESCROWED`

### 1.2 Implementation Flow

```
1. Buyer clicks "Pay with M-Pesa" on payment page
2. Frontend calls: POST /api/v1/payments/:transaction_id/deposit
3. API calls initiateC2BPayment() from packages/payments
4. Payment service:
   a. Gets OAuth token from Safaricom
   b. Calls STK Push API or Paybill API
   c. Returns provider reference
5. API stores provider reference in Transaction.paymentRef
6. Safaricom sends STK Push to buyer's phone
7. Buyer enters PIN on phone
8. Safaricom sends webhook callback to /api/v1/webhooks/m-pesa
9. API validates callback and updates Transaction status
```

### 1.3 Required Safaricom Credentials

You need to obtain these from Safaricom Developer Portal:

```
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_business_shortcode
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://your-domain.com/api/v1/webhooks/m-pesa
MPESA_ENVIRONMENT=sandbox  # or 'production'
```

### 1.4 Implementation Steps

#### Step 1: OAuth Token Generation

Create a function to get OAuth access token from Safaricom:

```typescript
// packages/payments/src/mpesaClient.ts

async function getMpesaAccessToken(): Promise<string> {
  const consumerKey = process.env.MPESA_CONSUMER_KEY!;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET!;
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  
  const response = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`
    }
  });
  
  const data = await response.json();
  return data.access_token;
}
```

#### Step 2: STK Push Implementation

Implement the actual STK Push call:

```typescript
async function initiateC2BPayment(
  params: MpesaC2BInitParams,
): Promise<MpesaC2BInitResult> {
  const accessToken = await getMpesaAccessToken();
  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey = process.env.MPESA_PASSKEY!;
  const callbackUrl = process.env.MPESA_CALLBACK_URL!;
  
  // Generate timestamp and password
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  
  // STK Push request
  const stkPushRequest = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: params.amount,
    PartyA: params.buyerPhone || '254700000000', // Default test number
    PartyB: shortcode,
    PhoneNumber: params.buyerPhone || '254700000000',
    CallBackURL: callbackUrl,
    AccountReference: params.transactionId,
    TransactionDesc: `Payment for ${params.transactionId}`
  };
  
  const response = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(stkPushRequest)
  });
  
  const result = await response.json();
  
  if (result.ResponseCode === '0') {
    return {
      providerRef: result.CheckoutRequestID,
      instructions: 'Please enter your M-Pesa PIN on your phone to complete the payment.'
    };
  } else {
    throw new Error(`M-Pesa STK Push failed: ${result.ResponseDescription}`);
  }
}
```

#### Step 3: Query STK Push Status

Add a function to check payment status:

```typescript
async function querySTKPushStatus(checkoutRequestID: string): Promise<any> {
  const accessToken = await getMpesaAccessToken();
  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey = process.env.MPESA_PASSKEY!;
  
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  
  const response = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestID
    })
  });
  
  return await response.json();
}
```

### 1.5 Webhook Handler Implementation

Update the webhook handler in `apps/api/src/index.ts`:

```typescript
app.post('/api/v1/webhooks/m-pesa', async (request, reply) => {
  // Validate webhook signature (important for security)
  const signature = request.headers['x-mpesa-signature'];
  // Implement signature validation logic here
  
  const body = request.body as any;
  
  // Handle STK Push callback
  if (body.Body?.stkCallback) {
    const callback = body.Body.stkCallback;
    const resultCode = callback.ResultCode;
    const checkoutRequestID = callback.CheckoutRequestID;
    const merchantRequestID = callback.MerchantRequestID;
    
    if (resultCode === 0) {
      // Payment successful
      const callbackMetadata = callback.CallbackMetadata;
      const amount = callbackMetadata.Item.find((i: any) => i.Name === 'Amount')?.Value;
      const mpesaReceiptNumber = callbackMetadata.Item.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value;
      const phoneNumber = callbackMetadata.Item.find((i: any) => i.Name === 'PhoneNumber')?.Value;
      
      // Find transaction by checkout request ID
      const tx = await prisma.transaction.findFirst({
        where: { paymentRef: checkoutRequestID }
      });
      
      if (tx && tx.status === 'PENDING') {
        // Update transaction and escrow
        await prisma.$transaction(async (trx) => {
          await trx.transaction.update({
            where: { id: tx.id },
            data: {
              status: 'ESCROWED',
              paymentRef: mpesaReceiptNumber
            }
          });
          
          await trx.escrow.update({
            where: { transactionId: tx.id },
            data: { heldAmount: amount }
          });
          
          // Create ledger entries
          await trx.ledgerEntry.create({
            data: {
              refType: 'TRANSACTION',
              refId: tx.id,
              entryType: 'CREDIT',
              account: 'ESCROW',
              amount,
              currency: tx.currency,
              transactionId: tx.id
            }
          });
        });
      }
    }
  }
  
  return reply.send({ ResultCode: 0, ResultDesc: 'Accepted' });
});
```

---

## 2. M-Pesa B2C (Business-to-Customer) Integration

### 2.1 What is B2C?

B2C allows businesses to send money to customers. In Paying-zee:
- Seller completes delivery
- Buyer confirms receipt
- System initiates payout to seller's M-Pesa number
- Transaction status changes to `COMPLETED`

### 2.2 Implementation Flow

```
1. Buyer confirms receipt
2. API calls initiateB2CPayout() from packages/payments
3. Payment service:
   a. Gets OAuth token
   b. Calls B2C API
   c. Returns provider reference
4. API creates Payout record
5. Safaricom processes payout
6. Safaricom sends webhook callback
7. API updates Payout status and ledger
```

### 2.3 B2C Implementation

```typescript
async function initiateB2CPayout(
  params: MpesaB2CPayoutParams,
): Promise<MpesaB2CPayoutResult> {
  const accessToken = await getMpesaAccessToken();
  const initiatorName = process.env.MPESA_INITIATOR_NAME!;
  const initiatorPassword = process.env.MPESA_INITIATOR_PASSWORD!;
  const shortcode = process.env.MPESA_SHORTCODE!;
  const queueTimeoutURL = process.env.MPESA_QUEUE_TIMEOUT_URL!;
  const resultURL = process.env.MPESA_RESULT_URL!;
  
  // Generate security credential (encrypted password)
  const securityCredential = encryptInitiatorPassword(initiatorPassword);
  
  const b2cRequest = {
    InitiatorName: initiatorName,
    SecurityCredential: securityCredential,
    CommandID: 'BusinessPayment',
    Amount: params.amount,
    PartyA: shortcode,
    PartyB: params.recipientPhone,
    Remarks: `Payout for transaction ${params.transactionId}`,
    QueueTimeOutURL: queueTimeoutURL,
    ResultURL: resultURL,
    Occasion: `Payout-${params.payoutId}`
  };
  
  const response = await fetch('https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(b2cRequest)
  });
  
  const result = await response.json();
  
  if (result.ResponseCode === '0') {
    return {
      providerRef: result.ConversationID,
      status: 'PENDING',
      message: 'Payout initiated successfully'
    };
  } else {
    return {
      providerRef: '',
      status: 'FAILED',
      message: result.ResponseDescription || 'Payout initiation failed'
    };
  }
}
```

### 2.4 B2C Webhook Handler

Add B2C webhook handling:

```typescript
// In apps/api/src/index.ts

app.post('/api/v1/webhooks/m-pesa/b2c', async (request, reply) => {
  const body = request.body as any;
  
  if (body.Result) {
    const result = body.Result;
    const conversationID = result.ConversationID;
    const resultCode = result.ResultCode;
    const resultDesc = result.ResultDescription;
    
    // Find payout by conversation ID
    const payout = await prisma.payout.findFirst({
      where: { payoutRef: conversationID }
    });
    
    if (payout) {
      if (resultCode === 0) {
        // Payout successful
        const resultParameters = result.ResultParameters?.ResultParameter || [];
        const amount = resultParameters.find((p: any) => p.Key === 'Amount')?.Value;
        const transactionReceipt = resultParameters.find((p: any) => p.Key === 'TransactionReceipt')?.Value;
        
        await prisma.payout.update({
          where: { id: payout.id },
          data: {
            status: 'SUCCESS',
            payoutRef: transactionReceipt,
            processedAt: new Date()
          }
        });
        
        // Update ledger entries
        // ... ledger update logic
      } else {
        // Payout failed
        await prisma.payout.update({
          where: { id: payout.id },
          data: {
            status: 'FAILED'
          }
        });
      }
    }
  }
  
  return reply.send({ ResultCode: 0, ResultDesc: 'Accepted' });
});
```

---

## 3. Security Considerations

### 3.1 Webhook Signature Validation

Always validate webhook signatures to prevent fraud:

```typescript
import crypto from 'crypto';

function validateMpesaWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('base64');
  
  return hash === signature;
}
```

### 3.2 Idempotency

Ensure webhooks are processed only once:

```typescript
// Store processed webhook IDs
const processedWebhooks = new Set<string>();

app.post('/api/v1/webhooks/m-pesa', async (request, reply) => {
  const webhookId = request.body.TransactionID || request.body.ConversationID;
  
  if (processedWebhooks.has(webhookId)) {
    return reply.send({ ResultCode: 0, ResultDesc: 'Already processed' });
  }
  
  processedWebhooks.add(webhookId);
  // Process webhook...
});
```

### 3.3 Environment Variables

Required environment variables:

```bash
# M-Pesa Credentials
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_INITIATOR_NAME=your_initiator_name
MPESA_INITIATOR_PASSWORD=your_initiator_password

# URLs
MPESA_CALLBACK_URL=https://your-domain.com/api/v1/webhooks/m-pesa
MPESA_QUEUE_TIMEOUT_URL=https://your-domain.com/api/v1/webhooks/m-pesa/timeout
MPESA_RESULT_URL=https://your-domain.com/api/v1/webhooks/m-pesa/b2c

# Environment
MPESA_ENVIRONMENT=sandbox  # or 'production'
```

---

## 4. Testing

### 4.1 Sandbox Testing

For sandbox testing, use Safaricom test credentials:
- Test phone numbers: 254708374149, 254712345678
- Test amounts: Any amount
- Test shortcode: 174379

### 4.2 Test Scenarios

1. **Successful C2B Payment**:
   - Initiate STK Push
   - Enter PIN on test phone
   - Verify webhook received
   - Check transaction status updated

2. **Failed C2B Payment**:
   - Initiate STK Push
   - Cancel on phone
   - Verify failure webhook
   - Check transaction remains PENDING

3. **Successful B2C Payout**:
   - Initiate payout
   - Verify webhook received
   - Check payout status updated
   - Verify ledger entries

4. **Failed B2C Payout**:
   - Initiate payout to invalid number
   - Verify failure webhook
   - Check payout status is FAILED

---

## 5. Production Checklist

Before going to production:

- [ ] Obtain production M-Pesa credentials from Safaricom
- [ ] Update all environment variables to production values
- [ ] Set up production webhook URLs (HTTPS required)
- [ ] Implement proper webhook signature validation
- [ ] Set up monitoring and alerting for payment failures
- [ ] Implement retry logic for failed payments
- [ ] Set up reconciliation process
- [ ] Test with real M-Pesa accounts (small amounts)
- [ ] Document production deployment process
- [ ] Set up backup webhook endpoints

---

## 6. Error Handling

### 6.1 Common Errors

- **Invalid credentials**: Check consumer key/secret
- **Invalid shortcode**: Verify shortcode matches environment
- **Network errors**: Implement retry logic
- **Webhook timeouts**: Set up queue timeout handler
- **Duplicate payments**: Implement idempotency checks

### 6.2 Retry Strategy

```typescript
async function initiateC2BPaymentWithRetry(
  params: MpesaC2BInitParams,
  maxRetries = 3
): Promise<MpesaC2BInitResult> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await initiateC2BPayment(params);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## 7. Resources

- [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
- [M-Pesa API Documentation](https://developer.safaricom.co.ke/APIs)
- [STK Push API Guide](https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate)
- [B2C API Guide](https://developer.safaricom.co.ke/APIs/BusinessToCustomer)

---

## 8. Next Steps

1. Obtain Safaricom API credentials
2. Implement OAuth token management
3. Implement STK Push for C2B
4. Implement B2C payout
5. Add webhook handlers
6. Implement signature validation
7. Add error handling and retries
8. Test in sandbox
9. Deploy to production

---

## Notes

- Always use HTTPS for webhook URLs in production
- Store credentials securely (use environment variables or secrets manager)
- Implement proper logging for all payment operations
- Monitor payment success rates and failures
- Set up alerts for payment issues
- Regular reconciliation is critical for financial accuracy

