# Payment Configuration Guide

This folder contains public DarkSun plan and settlement-route configuration.

`plans.json` separates global commercial terms from blockchain-specific payment routes:

- `plans`: USD-denominated price and access duration
- `routes`: one payment asset and treasury recipient per supported blockchain
- `quotePolicy`: public freshness and expiration rules for server-generated quotes

Add a new route only after the LTK asset and its treasury recipient are deployed on that chain. Private signing keys, treasury credentials and internal accounting instructions must never be stored here.

Settlement modes:

- `direct_treasury`: the wallet sends the payment asset directly to `settlement.recipient`.
- `payment_contract_forward`: the wallet sends the asset through the chain-specific smart contract in `settlement.contract`; the contract records the subscription on-chain and forwards the asset to the treasury in `settlement.recipient`.

For a contract-backed route, publish the route only after deployment and verification. The public route has this shape:

```json
{
  "settlement": {
    "mode": "payment_contract_forward",
    "contract": "<DEPLOYED_PAYMENT_CONTRACT>",
    "recipientKind": "dao_dao_core",
    "recipient": "<CHAIN_GOVERNANCE_TREASURY>"
  }
}
```

Every blockchain has its own contract address and treasury entry. The quote-signing private key remains secret and must never be stored in this registry.
