# Proposal Configuration Guide

This folder contains public proposal and funding configuration used by DarkSun governance-related features.

## What Belongs Here

Typical proposal configuration may include:

- proposal categories
- accepted payment assets
- target funding amounts
- escrow recipient addresses when publicly intended for that flow
- public descriptive labels used by the UI

## Public-Only Rule

Everything in this folder must be safe to expose publicly.

Allowed examples:

- public escrow recipient addresses
- public category metadata
- public payment asset references
- public target amounts

Do not add:

- private payout instructions
- internal treasury workflows
- unpublished recipient addresses
- temporary operational instructions
- internal approval notes

## Review Checklist

Before submitting a change, confirm that:

- the category keys are correct
- the payment asset references are valid
- the target amounts are intentional
- any escrow address is already public and approved for use
- the change matches the expected chain context

## Validation

Run:

```bash
node scripts/validate-registry.mjs
```
