# News feeds

`index.json` and `registry/index.json` reference `registry/news/feeds.json`.
The catalogue stores configuration only, never articles or wallet data.

Each source has a stable `key`, `name`, RSS/Atom `type`, HTTPS `feedUrl`,
`siteUrl`, optional `logoUrl`, `language`, `enabled`, `publisherType`,
`chains` and `tokenIds`. Keys must remain stable to preserve reading history.
`publisherType` is `darksun`, `media`, or `project`; project sources remain in
the ecosystem section. Only DarkSun editorial publications use `darksun`.

## Relevance

- DarkSun publications are global. Two latest articles remain visible regardless of age.
- An external source with `tokenIds` requires at least one of those exact registry
  tokens to be held. Declaring `chains` does **not** broaden a token-specific feed.
- With no token targets, at least one declared chain must contain a held position.
- The browser considers every enabled tracked wallet across saved portfolios,
  irrespective of the active wallet, active portfolio or selected chain filter.
- Positive amounts count even without a market price. Empty wallets, zero balances,
  disabled wallets and a shared ticker symbol do not establish token ownership.
- Identified staking and liquidity holdings count. Unknown DeFi assets are not
  guessed from pool names; their blockchain can still qualify.
- An empty portfolio gets only DarkSun publications. Unavailable wallets keep the
  last known data when available, with a partial-data indication.

Example of a token-specific source (replace the URL before enabling):

```json
{
  "key": "ustc-project", "name": "USTC project", "type": "rss",
  "publisherType": "project", "feedUrl": "https://example.org/feed/",
  "siteUrl": "https://example.org/", "enabled": false,
  "language": "en", "chains": ["terra_classic"],
  "tokenIds": ["terra_classic/native/uusd"]
}
```

Run `npm run validate` before publishing registry changes. Existing source changes
are picked up after the backend news cache expires (30 minutes by default), without
redeploying DarkSun. New feed formats may require parser support.

The external preview shows at most three items total and at most two per source
when several sources qualify. Full results can be expanded and filtered. External
articles do not increment the main notification bell; they have their own unread
indicator. RSS history is limited to the entries the publisher exposes.
