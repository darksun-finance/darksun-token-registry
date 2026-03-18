# Security Policy

## Purpose

This repository contains public metadata consumed by DarkSun applications.
Because it may be shared with token owners, validator operators, and ecosystem teams, it must never become a place where sensitive infrastructure or secrets are exposed.

## What Is Safe To Publish

Examples of safe public data:

- public websites and social links
- public token logos and validator logos
- public contract addresses
- public validator operator addresses
- public LCD / RPC / REST endpoints intended for public application use
- public provider names, websites, and logos
- public governance and proposal metadata

## What Must Never Be Published

Do not commit:

- API keys
- bearer tokens
- passwords
- secrets
- private keys
- mnemonics / seed phrases
- admin or back-office URLs
- internal monitoring or management dashboards
- private or allowlisted infrastructure endpoints
- unpublished contract addresses
- staging or test URLs not intended for public users
- internal operational notes that would help an attacker

## Reporting A Security Concern

If you believe sensitive information has been committed or proposed in a pull request:

1. Do not amplify the information publicly.
2. Contact the maintainers privately as soon as possible.
3. Include the file path and a short explanation of the concern.

If the issue is already committed, maintainers should remove or replace the data as quickly as possible and rotate any impacted secret or credential outside this repository.

## Reviewer Guidance

When reviewing changes, check for:

- private infrastructure URLs
- embedded tokens or credentials
- operational notes that expose system internals
- unofficial branding or misleading project links
- data that is public on-chain versus data that is private operational metadata

## Publication Principle

A simple rule helps here:

If the value would make an attacker’s job easier, it probably should not be committed.
