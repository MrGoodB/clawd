---
name: stripe
description: Manage Stripe payments - create customers, charges, subscriptions, and invoices. Use when you need to handle payments, billing, or financial operations via Stripe's API.
---

# Stripe API

Manage payments and billing via Stripe REST API.

## Setup

1. Get API key: https://dashboard.stripe.com/apikeys
2. Store key:
```bash
mkdir -p ~/.config/stripe
echo "sk_live_XXXXX" > ~/.config/stripe/api_key  # or sk_test_ for testing
```

## API Basics

```bash
STRIPE_KEY=$(cat ~/.config/stripe/api_key)

curl -s "https://api.stripe.com/v1/balance" \
  -u "${STRIPE_KEY}:" | jq
```

Note: `-u "${STRIPE_KEY}:"` uses key as username with empty password.

## List Customers

```bash
curl -s "https://api.stripe.com/v1/customers?limit=10" \
  -u "${STRIPE_KEY}:" | jq '.data[] | {id, email, name}'
```

## Create Customer

```bash
curl -s -X POST "https://api.stripe.com/v1/customers" \
  -u "${STRIPE_KEY}:" \
  -d "email=customer@example.com" \
  -d "name=John Doe" \
  -d "metadata[user_id]=123" | jq
```

## Get Customer

```bash
CUSTOMER_ID="cus_XXXXX"

curl -s "https://api.stripe.com/v1/customers/${CUSTOMER_ID}" \
  -u "${STRIPE_KEY}:" | jq
```

## Create Payment Intent

```bash
curl -s -X POST "https://api.stripe.com/v1/payment_intents" \
  -u "${STRIPE_KEY}:" \
  -d "amount=1000" \
  -d "currency=eur" \
  -d "customer=${CUSTOMER_ID}" \
  -d "payment_method_types[]=card" | jq '{id, client_secret, status}'
```

Amount is in cents (1000 = €10.00).

## List Products

```bash
curl -s "https://api.stripe.com/v1/products?active=true" \
  -u "${STRIPE_KEY}:" | jq '.data[] | {id, name, description}'
```

## Create Product

```bash
curl -s -X POST "https://api.stripe.com/v1/products" \
  -u "${STRIPE_KEY}:" \
  -d "name=Pro Plan" \
  -d "description=Full access to all features" | jq
```

## Create Price

```bash
PRODUCT_ID="prod_XXXXX"

curl -s -X POST "https://api.stripe.com/v1/prices" \
  -u "${STRIPE_KEY}:" \
  -d "product=${PRODUCT_ID}" \
  -d "unit_amount=2900" \
  -d "currency=eur" \
  -d "recurring[interval]=month" | jq
```

## Create Subscription

```bash
PRICE_ID="price_XXXXX"

curl -s -X POST "https://api.stripe.com/v1/subscriptions" \
  -u "${STRIPE_KEY}:" \
  -d "customer=${CUSTOMER_ID}" \
  -d "items[0][price]=${PRICE_ID}" | jq '{id, status, current_period_end}'
```

## Cancel Subscription

```bash
SUBSCRIPTION_ID="sub_XXXXX"

curl -s -X DELETE "https://api.stripe.com/v1/subscriptions/${SUBSCRIPTION_ID}" \
  -u "${STRIPE_KEY}:" | jq '{id, status}'
```

## Create Invoice

```bash
curl -s -X POST "https://api.stripe.com/v1/invoices" \
  -u "${STRIPE_KEY}:" \
  -d "customer=${CUSTOMER_ID}" \
  -d "auto_advance=true" | jq
```

## List Invoices

```bash
curl -s "https://api.stripe.com/v1/invoices?customer=${CUSTOMER_ID}&limit=10" \
  -u "${STRIPE_KEY}:" | jq '.data[] | {id, amount_due, status, hosted_invoice_url}'
```

## Create Checkout Session

```bash
curl -s -X POST "https://api.stripe.com/v1/checkout/sessions" \
  -u "${STRIPE_KEY}:" \
  -d "mode=payment" \
  -d "success_url=https://example.com/success" \
  -d "cancel_url=https://example.com/cancel" \
  -d "line_items[0][price]=${PRICE_ID}" \
  -d "line_items[0][quantity]=1" | jq '{id, url}'
```

## Get Balance

```bash
curl -s "https://api.stripe.com/v1/balance" \
  -u "${STRIPE_KEY}:" | jq '.available[] | {amount, currency}'
```

## List Charges

```bash
curl -s "https://api.stripe.com/v1/charges?limit=10" \
  -u "${STRIPE_KEY}:" | jq '.data[] | {id, amount, status, customer}'
```

## Refund Charge

```bash
CHARGE_ID="ch_XXXXX"

curl -s -X POST "https://api.stripe.com/v1/refunds" \
  -u "${STRIPE_KEY}:" \
  -d "charge=${CHARGE_ID}" | jq
```

## Webhooks

List webhooks:
```bash
curl -s "https://api.stripe.com/v1/webhook_endpoints" \
  -u "${STRIPE_KEY}:" | jq '.data[] | {id, url, enabled_events}'
```

Create webhook:
```bash
curl -s -X POST "https://api.stripe.com/v1/webhook_endpoints" \
  -u "${STRIPE_KEY}:" \
  -d "url=https://example.com/webhook" \
  -d "enabled_events[]=payment_intent.succeeded" \
  -d "enabled_events[]=customer.subscription.created" | jq
```

## Test Mode

Use `sk_test_` keys for testing. Test card: `4242424242424242`

## Rate Limits

- 100 read requests/second
- 100 write requests/second
- Higher limits available on request
