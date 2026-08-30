import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const publicIndexPath = path.join(root, "index.json");
const indexPath = path.join(root, "registry", "index.json");
const chainsDir = path.join(root, "registry", "chains");
const dexDir = path.join(root, "registry", "dex");
const proposalsDir = path.join(root, "registry", "proposals");
const applicationConfigPath = path.join(root, "registry", "ui", "application.json");
const paymentsConfigPath = path.join(root, "registry", "payments", "plans.json");

const TERRA_CONTRACT_RE = /^terra1[0-9a-z]{20,}$/;
const BECH32_ADDRESS_RE = /^[a-z][a-z0-9]{1,30}1[0-9a-z]{20,}$/;
const VALIDATOR_OPERATOR_RE = /^[a-z][a-z0-9]*valoper1[0-9a-z]+$/;

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
}

function warn(message) {
  console.warn(`WARN: ${message}`);
}

function readJson(filePath) {
  const sourceName = path.relative(root, filePath);
  const raw = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (error) {
    const message = String(error?.message || error);
    const directMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
    if (directMatch) {
      fail(`${sourceName}: invalid JSON at line ${directMatch[1]}, column ${directMatch[2]}: ${message}`);
      return null;
    }

    const posMatch = message.match(/position\s+(\d+)/i);
    if (posMatch) {
      const position = Number(posMatch[1]);
      const prefix = raw.slice(0, Math.max(0, position));
      const lines = prefix.split("\n");
      const line = lines.length;
      const column = Number(lines[lines.length - 1]?.length || 0) + 1;
      fail(`${sourceName}: invalid JSON at line ${line}, column ${column}: ${message}`);
      return null;
    }

    fail(`${sourceName}: invalid JSON: ${message}`);
    return null;
  }
}

function chainVariants(chainKey = "") {
  const raw = String(chainKey || "").trim();
  if (!raw) return [];
  const underscore = raw.replace(/-/g, "_");
  const dash = raw.replace(/_/g, "-");
  return Array.from(new Set([raw, underscore, dash]));
}

function normalizeChain(value = "") {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
}

function normalizeRef(value = "") {
  return String(value || "").trim().toLowerCase();
}

function normalizeAssetKey(value = "") {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "_");
}

function getTokenLogoHint(chain = "", symbol = "") {
  const chainSlug = String(chain || "chain").replace(/_/g, "-");
  const symbolSlug = String(symbol || "token").toLowerCase();
  return `tokens/${chainSlug}/${symbolSlug}.svg`;
}

function getDexLogoHint(dexId = "") {
  const id = String(dexId || "dex").toLowerCase();
  return `assets/dex/${id}.svg`;
}

function ensureAssetPathExists(sourceName, logoURI, options = {}) {
  const kind = String(options.kind || "asset").trim().toLowerCase();
  const chain = String(options.chain || "").trim();
  const symbol = String(options.symbol || "").trim();
  const dexId = String(options.dexId || "").trim();
  const value = String(logoURI || "").trim();
  const locationHint =
    kind === "dex"
      ? `Place the logo file under 'assets/dex/' (example: '${getDexLogoHint(dexId)}').`
      : `Place the logo file under 'tokens/<chain>/' (example: '${getTokenLogoHint(chain, symbol)}').`;

  if (!value) {
    fail(`${sourceName}: logoURI is empty. ${locationHint}`);
    return;
  }
  if (/^https?:\/\//i.test(value)) return;
  const absolute = path.join(root, value);
  if (!fs.existsSync(absolute)) {
    fail(`${sourceName}: logoURI does not exist '${value}'. ${locationHint}`);
  }
}

function getTokenIdentifier(token = {}) {
  const type = String(token?.type || "").trim().toLowerCase();
  if (type === "cw20") return String(token?.contract || token?.contractAddress || "").trim();
  return String(token?.denom || "").trim();
}

function validateToken(token, sourceName, ids, symbols, expectedChain) {
  const required = ["id", "chain", "type", "symbol", "name", "decimals", "verified", "tags", "logoURI"];
  for (const key of required) {
    if (!(key in token)) fail(`${sourceName}: missing required field '${key}'`);
  }

  if (token.chain !== expectedChain) {
    fail(`${sourceName}: token.chain '${token.chain}' must match chain file '${expectedChain}'`);
  }
  if (!["native", "cw20", "ibc"].includes(token.type)) fail(`${sourceName}: invalid type '${token.type}'`);
  if (token.type === "cw20" && !token.contract) fail(`${sourceName}: cw20 token must include 'contract'`);
  if (["native", "ibc"].includes(token.type) && !token.denom) fail(`${sourceName}: ${token.type} token must include 'denom'`);
  if (!Number.isInteger(token.decimals) || token.decimals < 0 || token.decimals > 30) {
    fail(`${sourceName}: decimals must be integer in range [0, 30]`);
  }
  if (!Array.isArray(token.tags)) fail(`${sourceName}: tags must be an array`);

  if (Array.isArray(token.priceSources) && token.priceSources.length) {
    const providerOrder = token.priceSources.map((item) => String(item?.provider || ""));
    const expected = ["coinmarketcap", "coingecko", "vyntrex"];
    const orderIndex = providerOrder.map((provider) => expected.indexOf(provider)).filter((v) => v >= 0);
    for (let i = 1; i < orderIndex.length; i += 1) {
      if (orderIndex[i] < orderIndex[i - 1]) {
        fail(`${sourceName}: priceSources must follow priority coinmarketcap -> coingecko -> vyntrex`);
        break;
      }
    }
  }

  if (ids.has(token.id)) fail(`${sourceName}: duplicated id '${token.id}'`);
  ids.add(token.id);

  const symbolKey = `${token.chain}:${String(token.symbol || "").toUpperCase()}:${token.type}`;
  if (symbols.has(symbolKey)) {
    warn(`${sourceName}: duplicate symbol+type detected '${symbolKey}'`);
  }
  symbols.add(symbolKey);

  ensureAssetPathExists(sourceName, token.logoURI, {
    kind: "token",
    chain: expectedChain,
    symbol: token.symbol,
  });
}

function normalizeDexFileKey(fileName = "") {
  return String(fileName || "")
    .replace(/\.json$/i, "")
    .trim();
}

function isTerraContract(value) {
  return TERRA_CONTRACT_RE.test(String(value || "").trim());
}

function isHttpUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
}

function validateChainNetwork(network, sourceName) {
  if (!network || typeof network !== "object") {
    fail(`${sourceName}: missing top-level 'network' object`);
    return;
  }

  const lcd = Array.isArray(network.lcd) ? network.lcd : [];
  const rpc = Array.isArray(network.rpc) ? network.rpc : [];
  const namespace = String(network.namespace || "cosmos").trim().toLowerCase();

  if (namespace === "eip155") {
    const chainId = String(network.chainId || "").trim();
    if (!/^\d+$/.test(chainId) || BigInt(chainId || "0") <= 0n) {
      fail(`${sourceName}: EVM network.chainId must be a positive decimal chain id`);
    }
  } else if (namespace === "solana") {
    const chainId = String(network.chainId || "").trim();
    const genesisHash = String(network.genesisHash || "").trim();
    if (!chainId) {
      fail(`${sourceName}: Solana network.chainId is required`);
    }
    if (!genesisHash) {
      fail(`${sourceName}: Solana network.genesisHash is required`);
    }
  } else if (!lcd.length) {
    fail(`${sourceName}: network.lcd must contain at least one endpoint`);
  }
  if (!rpc.length) {
    fail(`${sourceName}: network.rpc must contain at least one endpoint`);
  }

  for (const endpoint of lcd) {
    if (!isHttpUrl(endpoint)) {
      fail(`${sourceName}: invalid network.lcd endpoint '${endpoint}'`);
    }
  }
  for (const endpoint of rpc) {
    if (!isHttpUrl(endpoint)) {
      fail(`${sourceName}: invalid network.rpc endpoint '${endpoint}'`);
    } else if (namespace === "eip155" && !String(endpoint).trim().toLowerCase().startsWith("https://")) {
      fail(`${sourceName}: EVM network.rpc endpoints must use HTTPS`);
    }
  }
}

function validateChainStaking(staking, sourceName) {
  if (staking === undefined) return;
  if (!staking || typeof staking !== "object" || Array.isArray(staking)) {
    fail(`${sourceName}: top-level 'staking' must be an object`);
    return;
  }

  const preferred = staking.preferredValidator;
  if (preferred === undefined) return;
  if (!preferred || typeof preferred !== "object" || Array.isArray(preferred)) {
    fail(`${sourceName}: staking.preferredValidator must be an object`);
    return;
  }

  const moniker = String(preferred.moniker || "").trim();
  const operatorAddress = String(preferred.operatorAddress || "").trim();
  if (!moniker) {
    fail(`${sourceName}: staking.preferredValidator.moniker is required`);
  }
  if (operatorAddress && !VALIDATOR_OPERATOR_RE.test(operatorAddress)) {
    fail(`${sourceName}: invalid staking.preferredValidator.operatorAddress '${operatorAddress}'`);
  }
}

function validateDexEntry(dex, sourceName, dexIds) {
  const required = ["id", "name", "factory"];
  for (const key of required) {
    if (!(key in dex)) fail(`${sourceName}: dex missing required field '${key}'`);
  }

  const id = String(dex.id || "").trim();
  const name = String(dex.name || "").trim();
  const factory = String(dex.factory || dex.factoryContract || "").trim();
  const router = String(dex.router || "").trim();

  if (!id) fail(`${sourceName}: dex.id is empty`);
  if (!name) fail(`${sourceName}: dex.name is empty`);
  if (!isTerraContract(factory)) {
    fail(`${sourceName}: dex '${id}' has invalid factory '${factory}'`);
  }
  if (router && !isTerraContract(router)) {
    fail(`${sourceName}: dex '${id}' has invalid router '${router}'`);
  }

  if (dexIds.has(id)) {
    fail(`${sourceName}: duplicated dex id '${id}'`);
  }
  dexIds.add(id);

  if ("logoURI" in dex) {
    ensureAssetPathExists(`${sourceName} (dex '${id}')`, dex.logoURI, {
      kind: "dex",
      dexId: id,
    });
  }
}

function validateDexFile(filePath, chainKeys) {
  const sourceName = path.relative(root, filePath);
  const payload = readJson(filePath);
  if (!payload) return;

  const fileChainKey = normalizeDexFileKey(path.basename(filePath));
  const chain = String(payload?.chain || "").trim();
  if (!chain) {
    fail(`${sourceName}: missing top-level 'chain'`);
  } else {
    const variants = chainVariants(chain);
    if (!variants.includes(fileChainKey)) {
      fail(`${sourceName}: file name '${fileChainKey}' must match top-level chain '${chain}'`);
    }
  }

  if (!Array.isArray(payload?.dexes)) {
    fail(`${sourceName}: missing dexes[]`);
    return;
  }

  const dexIds = new Set();
  for (const dex of payload.dexes) {
    validateDexEntry(dex, sourceName, dexIds);
  }

  const knownByIndex = Array.from(chainKeys).flatMap((key) => chainVariants(key));
  if (chain && !knownByIndex.includes(chain)) {
    warn(`${sourceName}: chain '${chain}' is not declared in registry/index.json`);
  }
}

function validateDexRegistry(chainKeys) {
  if (!fs.existsSync(dexDir)) {
    warn("registry/dex directory not found; skipping dex validation");
    return;
  }

  const files = fs
    .readdirSync(dexDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => path.join(dexDir, name));

  if (!files.length) {
    warn("registry/dex has no .json files");
    return;
  }

  for (const filePath of files) {
    validateDexFile(filePath, chainKeys);
  }
}

function getProposalAssetIdentifier(asset = {}) {
  return String(asset?.contract || asset?.ibcDenom || asset?.ibc_denom || asset?.denom || asset?.assetRef || asset?.ref || "").trim();
}

function assetExistsOnChain(chainTokenIdentifiers, chainKey, identifier) {
  const normalizedChain = normalizeChain(chainKey);
  const normalizedIdentifier = normalizeRef(identifier);
  if (!normalizedChain || !normalizedIdentifier) return false;
  const set = chainTokenIdentifiers.get(normalizedChain);
  return Boolean(set && set.has(normalizedIdentifier));
}

function resolveProposalAssetValue(value = "", byKey = new Map(), byIdentifier = new Set()) {
  const normalized = normalizeRef(value);
  if (!normalized) return "";
  if (byIdentifier.has(normalized)) return normalized;
  const asKey = normalizeAssetKey(value);
  if (byKey.has(asKey)) return byKey.get(asKey);
  return "";
}

function validateProposalFile(filePath, chainKeys, chainTokenIdentifiers) {
  const sourceName = path.relative(root, filePath);
  const payload = readJson(filePath);
  if (!payload) return;
  const paymentAssets = Array.isArray(payload?.paymentAssets) ? payload.paymentAssets : [];

  if (!paymentAssets.length) {
    fail(`${sourceName}: paymentAssets[] is required and cannot be empty`);
    return;
  }

  const paymentAssetByKey = new Map();
  const paymentAssetIdentifiers = new Set();

  for (const asset of paymentAssets) {
    const key = normalizeAssetKey(asset?.key);
    const chain = normalizeChain(asset?.chain);
    const identifier = getProposalAssetIdentifier(asset);

    if (!key) fail(`${sourceName}: paymentAssets[] entry missing 'key'`);
    if (!chain) fail(`${sourceName}: paymentAssets[] entry missing 'chain'`);
    if (!identifier) fail(`${sourceName}: paymentAssets[] entry must include one of denom/ibcDenom/contract/ref`);

    const chainKnown = Array.from(chainKeys).some((k) => normalizeChain(k) === chain);
    if (!chainKnown) {
      fail(`${sourceName}: paymentAssets '${key || "<no-key>"}' references unknown chain '${asset?.chain || ""}'`);
      continue;
    }

    if (!assetExistsOnChain(chainTokenIdentifiers, chain, identifier)) {
      fail(`${sourceName}: paymentAssets '${key || "<no-key>"}' references '${identifier}' not found in registry/chains/${chain}.json`);
    }

    if (key) paymentAssetByKey.set(key, normalizeRef(identifier));
    if (identifier) paymentAssetIdentifiers.add(normalizeRef(identifier));
  }

  const blockchains = Array.isArray(payload?.blockchains) ? payload.blockchains : [];
  for (const row of blockchains) {
    const rowKey = normalizeChain(row?.key);
    if (!rowKey) {
      fail(`${sourceName}: blockchains[] entry missing 'key'`);
      continue;
    }
    const chainKnown = Array.from(chainKeys).some((k) => normalizeChain(k) === rowKey);
    if (!chainKnown) {
      fail(`${sourceName}: blockchains '${row?.key}' is not declared in registry/index.json`);
    }

    const escrowContract = String(row?.escrowContract || "").trim();
    const escrowRecipient = String(row?.escrowRecipient || "").trim();
    if (!BECH32_ADDRESS_RE.test(escrowContract)) {
      fail(`${sourceName}: blockchains '${row?.key}' escrowContract '${escrowContract}' is not a valid bech32 address`);
    }
    if (!BECH32_ADDRESS_RE.test(escrowRecipient)) {
      fail(`${sourceName}: blockchains '${row?.key}' escrowRecipient '${escrowRecipient}' is not a valid bech32 address`);
    }

    const acceptedKeys = Array.isArray(row?.acceptedPaymentAssetKeys) ? row.acceptedPaymentAssetKeys : [];
    for (const item of acceptedKeys) {
      const resolved = resolveProposalAssetValue(item, paymentAssetByKey, paymentAssetIdentifiers);
      if (!resolved) {
        fail(`${sourceName}: blockchains '${row?.key}' has unknown acceptedPaymentAssetKeys value '${item}'`);
      }
    }

    const acceptedRefs = Array.isArray(row?.acceptedPaymentAssetRefs) ? row.acceptedPaymentAssetRefs : [];
    for (const item of acceptedRefs) {
      const resolved = resolveProposalAssetValue(item, paymentAssetByKey, paymentAssetIdentifiers);
      if (!resolved) {
        fail(`${sourceName}: blockchains '${row?.key}' has unknown acceptedPaymentAssetRefs value '${item}'`);
      }
    }

    const defaultKey = String(row?.defaultPaymentAssetKey || "").trim();
    if (defaultKey) {
      const resolved = resolveProposalAssetValue(defaultKey, paymentAssetByKey, paymentAssetIdentifiers);
      if (!resolved) {
        fail(`${sourceName}: blockchains '${row?.key}' has unknown defaultPaymentAssetKey '${defaultKey}'`);
      }
    }

    const defaultRef = String(row?.defaultPaymentAssetRef || "").trim();
    if (defaultRef) {
      const resolved = resolveProposalAssetValue(defaultRef, paymentAssetByKey, paymentAssetIdentifiers);
      if (!resolved) {
        fail(`${sourceName}: blockchains '${row?.key}' has unknown defaultPaymentAssetRef '${defaultRef}'`);
      }
    }
  }

  const categories = Array.isArray(payload?.categories) ? payload.categories : [];
  for (const category of categories) {
    const categoryKey = String(category?.key || "").trim() || "<unknown>";
    if ("targetAmount" in category || "targetAmounts" in category) {
      fail(`${sourceName}: category '${categoryKey}' uses legacy targetAmount/targetAmounts fields. Use targetAmountUsd/targetAmountsUsd only.`);
    }
    const hasGlobalUsd = Number.isFinite(Number(category?.targetAmountUsd));
    const hasPerChainUsd =
      category?.targetAmountsUsd &&
      typeof category.targetAmountsUsd === "object" &&
      Object.keys(category.targetAmountsUsd).length > 0;
    if (!hasGlobalUsd && !hasPerChainUsd) {
      fail(`${sourceName}: category '${categoryKey}' must define targetAmountUsd or targetAmountsUsd.`);
    }
    const paymentAssetKey = String(category?.paymentAssetKey || "").trim();
    if (paymentAssetKey) {
      const resolved = resolveProposalAssetValue(paymentAssetKey, paymentAssetByKey, paymentAssetIdentifiers);
      if (!resolved) {
        fail(`${sourceName}: category '${categoryKey}' has unknown paymentAssetKey '${paymentAssetKey}'`);
      }
    }

    const paymentAssetRef = String(category?.paymentAssetRef || "").trim();
    if (paymentAssetRef) {
      const resolved = resolveProposalAssetValue(paymentAssetRef, paymentAssetByKey, paymentAssetIdentifiers);
      if (!resolved) {
        fail(`${sourceName}: category '${categoryKey}' has unknown paymentAssetRef '${paymentAssetRef}'`);
      }
    }

    if (category?.paymentAssetKeys && typeof category.paymentAssetKeys === "object") {
      for (const [chain, value] of Object.entries(category.paymentAssetKeys)) {
        const resolved = resolveProposalAssetValue(value, paymentAssetByKey, paymentAssetIdentifiers);
        if (!resolved) {
          fail(`${sourceName}: category '${categoryKey}' has unknown paymentAssetKeys['${chain}'] value '${value}'`);
        }
      }
    }

    if (category?.paymentAssetRefs && typeof category.paymentAssetRefs === "object") {
      for (const [chain, value] of Object.entries(category.paymentAssetRefs)) {
        const resolved = resolveProposalAssetValue(value, paymentAssetByKey, paymentAssetIdentifiers);
        if (!resolved) {
          fail(`${sourceName}: category '${categoryKey}' has unknown paymentAssetRefs['${chain}'] value '${value}'`);
        }
      }
    }

    if (hasPerChainUsd) {
      for (const [chain, value] of Object.entries(category.targetAmountsUsd)) {
        if (!Number.isFinite(Number(value)) || Number(value) < 0) {
          fail(`${sourceName}: category '${categoryKey}' has invalid targetAmountsUsd['${chain}'] value '${value}'`);
        }
      }
    }
  }
}

function validateProposalsRegistry(chainKeys, chainTokenIdentifiers) {
  if (!fs.existsSync(proposalsDir)) {
    warn("registry/proposals directory not found; skipping proposals validation");
    return;
  }

  const files = fs
    .readdirSync(proposalsDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => path.join(proposalsDir, name));

  if (!files.length) {
    warn("registry/proposals has no .json files");
    return;
  }

  for (const filePath of files) {
    validateProposalFile(filePath, chainKeys, chainTokenIdentifiers);
  }
}

function validateApplicationConfig(chainKeys, chainTokenIdentifiers) {
  if (!fs.existsSync(applicationConfigPath)) {
    fail("registry/ui/application.json not found");
    return;
  }
  const sourceName = path.relative(root, applicationConfigPath);
  const payload = readJson(applicationConfigPath);
  if (!payload) return;
  const accessPlan = payload?.accessPlan;
  if (!accessPlan || typeof accessPlan !== "object" || Array.isArray(accessPlan)) {
    fail(`${sourceName}: accessPlan must be an object`);
    return;
  }
  if (!Number.isInteger(accessPlan.freeWalletLimit) || accessPlan.freeWalletLimit < 1 || accessPlan.freeWalletLimit > 1_000) {
    fail(`${sourceName}: accessPlan.freeWalletLimit must be an integer in range [1, 1000]`);
  }
  if (!Number.isFinite(accessPlan.ltkMinimum) || accessPlan.ltkMinimum < 1 || accessPlan.ltkMinimum > 1_000_000_000_000) {
    fail(`${sourceName}: accessPlan.ltkMinimum must be a number in range [1, 1000000000000]`);
  }
  const token = accessPlan.eligibilityToken;
  if (!token || typeof token !== "object" || Array.isArray(token)) {
    fail(`${sourceName}: accessPlan.eligibilityToken must be an object`);
    return;
  }
  const chain = normalizeChain(token.chain);
  const contract = String(token.contract || "").trim();
  if (!String(token.symbol || "").trim()) {
    fail(`${sourceName}: accessPlan.eligibilityToken.symbol is required`);
  }
  if (!Array.from(chainKeys).some((key) => normalizeChain(key) === chain)) {
    fail(`${sourceName}: accessPlan.eligibilityToken.chain '${token.chain || ""}' is not declared in registry/index.json`);
  }
  if (!TERRA_CONTRACT_RE.test(contract)) {
    fail(`${sourceName}: accessPlan.eligibilityToken.contract '${contract}' is not a valid Terra contract`);
  } else if (!assetExistsOnChain(chainTokenIdentifiers, chain, contract)) {
    fail(`${sourceName}: accessPlan.eligibilityToken.contract '${contract}' is not listed in the '${token.chain}' token registry`);
  }
}

function validatePaymentsConfig(chainKeys, chainTokenIdentifiers, tokenIds) {
  if (!fs.existsSync(paymentsConfigPath)) {
    fail("registry/payments/plans.json not found");
    return;
  }
  const sourceName = path.relative(root, paymentsConfigPath);
  const payload = readJson(paymentsConfigPath);
  if (!payload) return;
  if (!Number.isInteger(payload.schemaVersion) || payload.schemaVersion < 1) {
    fail(`${sourceName}: schemaVersion must be a positive integer`);
  }
  const plans = payload?.plans;
  if (!plans || typeof plans !== "object" || Array.isArray(plans) || !Object.keys(plans).length) {
    fail(`${sourceName}: plans must be a non-empty object`);
    return;
  }
  for (const [planKey, plan] of Object.entries(plans)) {
    if (!/^[a-z0-9_]+$/.test(planKey)) {
      fail(`${sourceName}: invalid plan key '${planKey}'`);
    }
    if (!String(plan?.label || "").trim()) {
      fail(`${sourceName}: plan '${planKey}' requires a label`);
    }
    if (!Number.isInteger(plan?.priceUsdCents) || plan.priceUsdCents < 1 || plan.priceUsdCents > 100_000_000) {
      fail(`${sourceName}: plan '${planKey}' priceUsdCents must be an integer in range [1, 100000000]`);
    }
    if (!Number.isInteger(plan?.durationDays) || plan.durationDays < 1 || plan.durationDays > 3_650) {
      fail(`${sourceName}: plan '${planKey}' durationDays must be an integer in range [1, 3650]`);
    }
  }

  if (!Array.isArray(payload.routes) || !payload.routes.length) {
    fail(`${sourceName}: routes must be a non-empty array`);
    return;
  }
  const routeKeys = new Set();
  for (const route of payload.routes) {
    const routeKey = String(route?.key || "").trim();
    const chain = normalizeChain(route?.chain);
    const planKey = String(route?.planKey || "").trim();
    const asset = route?.paymentAsset;
    const settlement = route?.settlement;
    const quotePolicy = route?.quotePolicy;
    if (!/^[a-z0-9_]+$/.test(routeKey)) {
      fail(`${sourceName}: invalid payment route key '${routeKey}'`);
    } else if (routeKeys.has(routeKey)) {
      fail(`${sourceName}: duplicated payment route key '${routeKey}'`);
    }
    routeKeys.add(routeKey);
    if (typeof route?.enabled !== "boolean") {
      fail(`${sourceName}: route '${routeKey}' enabled must be a boolean`);
    }
    if (!Array.from(chainKeys).some((key) => normalizeChain(key) === chain)) {
      fail(`${sourceName}: route '${routeKey}' chain '${route?.chain || ""}' is not declared in registry/index.json`);
    }
    if (!plans[planKey]) {
      fail(`${sourceName}: route '${routeKey}' references unknown plan '${planKey}'`);
    }
    if (!asset || typeof asset !== "object" || Array.isArray(asset)) {
      fail(`${sourceName}: route '${routeKey}' paymentAsset must be an object`);
      continue;
    }
    const assetId = String(asset.id || "").trim();
    const assetType = String(asset.type || "").trim().toLowerCase();
    const assetContract = String(asset.contract || "").trim();
    const assetDenom = String(asset.denom || "").trim();
    if (!tokenIds.has(assetId)) {
      fail(`${sourceName}: route '${routeKey}' payment asset id '${assetId}' is not declared in the token registry`);
    }
    if (!String(asset.symbol || "").trim()) {
      fail(`${sourceName}: route '${routeKey}' paymentAsset.symbol is required`);
    }
    if (!["cw20", "native", "ibc"].includes(assetType)) {
      fail(`${sourceName}: route '${routeKey}' has unsupported payment asset type '${assetType}'`);
    }
    if (!Number.isInteger(asset.decimals) || asset.decimals < 0 || asset.decimals > 30) {
      fail(`${sourceName}: route '${routeKey}' paymentAsset.decimals must be an integer in range [0, 30]`);
    }
    const paymentAssetIdentifier = assetType === "cw20" ? assetContract : assetDenom;
    if (assetType === "cw20" && !BECH32_ADDRESS_RE.test(assetContract)) {
      fail(`${sourceName}: route '${routeKey}' paymentAsset.contract '${assetContract}' is not a valid bech32 contract`);
    } else if (assetType !== "cw20" && !assetDenom) {
      fail(`${sourceName}: route '${routeKey}' paymentAsset.denom is required for '${assetType}' assets`);
    } else if (!assetExistsOnChain(chainTokenIdentifiers, chain, paymentAssetIdentifier)) {
      fail(`${sourceName}: route '${routeKey}' payment asset '${paymentAssetIdentifier}' is not listed for '${route?.chain}'`);
    }
    if (!settlement || typeof settlement !== "object" || Array.isArray(settlement)) {
      fail(`${sourceName}: route '${routeKey}' settlement must be an object`);
    } else {
      const mode = String(settlement.mode || "").trim();
      const recipient = String(settlement.recipient || "").trim();
      const paymentContract = String(settlement.contract || "").trim();
      if (!["direct_treasury", "payment_contract_forward"].includes(mode)) {
        fail(`${sourceName}: route '${routeKey}' has unsupported settlement mode '${mode}'`);
      }
      if (!String(settlement.recipientKind || "").trim()) {
        fail(`${sourceName}: route '${routeKey}' settlement.recipientKind is required`);
      }
      if (!BECH32_ADDRESS_RE.test(recipient)) {
        fail(`${sourceName}: route '${routeKey}' settlement recipient '${recipient}' is not a valid bech32 address`);
      }
      if (mode === "payment_contract_forward" && !BECH32_ADDRESS_RE.test(paymentContract)) {
        fail(`${sourceName}: route '${routeKey}' settlement.contract '${paymentContract}' is not a valid bech32 address`);
      }
    }
    if (!quotePolicy || typeof quotePolicy !== "object" || Array.isArray(quotePolicy)) {
      fail(`${sourceName}: route '${routeKey}' quotePolicy must be an object`);
    } else {
      if (String(quotePolicy.currency || "").trim().toUpperCase() !== "USD") {
        fail(`${sourceName}: route '${routeKey}' quotePolicy.currency must be USD`);
      }
      if (!Number.isInteger(quotePolicy.ttlSeconds) || quotePolicy.ttlSeconds < 30 || quotePolicy.ttlSeconds > 3_600) {
        fail(`${sourceName}: route '${routeKey}' quotePolicy.ttlSeconds must be an integer in range [30, 3600]`);
      }
      if (!Number.isInteger(quotePolicy.maxPriceAgeSeconds) || quotePolicy.maxPriceAgeSeconds < 30 || quotePolicy.maxPriceAgeSeconds > 3_600) {
        fail(`${sourceName}: route '${routeKey}' quotePolicy.maxPriceAgeSeconds must be an integer in range [30, 3600]`);
      }
      if (quotePolicy.allowStalePrice !== false) {
        fail(`${sourceName}: route '${routeKey}' quotePolicy.allowStalePrice must be false`);
      }
    }
  }
}

function main() {
  if (!fs.existsSync(publicIndexPath)) {
    fail("index.json not found");
    return;
  }
  if (!fs.existsSync(indexPath)) {
    fail("registry/index.json not found");
    return;
  }

  const publicIndex = readJson(publicIndexPath);
  const index = readJson(indexPath);
  if (!publicIndex || !index) return;
  const publicChains = new Map(
    (Array.isArray(publicIndex.chains) ? publicIndex.chains : []).map((entry) => [
      String(entry?.key || "").trim(),
      String(entry?.file || "").trim(),
    ])
  );
  if (!Array.isArray(index.chains) || !index.chains.length) {
    fail("registry/index.json must contain chains[]");
    return;
  }

  const ids = new Set();
  const symbols = new Set();
  const chainKeys = new Set();
  const chainTokenIdentifiers = new Map();

  for (const chainEntry of index.chains) {
    const key = String(chainEntry?.key || "").trim();
    const file = String(chainEntry?.file || "").trim();
    if (!key || !file) {
      fail("registry/index.json: each chain must include 'key' and 'file'");
      continue;
    }
    if (chainKeys.has(key)) {
      fail(`registry/index.json: duplicated chain key '${key}'`);
      continue;
    }
    chainKeys.add(key);
    if (publicChains.get(key) !== file) {
      fail(`index.json and registry/index.json must declare the same file for chain '${key}'`);
    }

    const normalizedKey = normalizeChain(key);
    if (!chainTokenIdentifiers.has(normalizedKey)) {
      chainTokenIdentifiers.set(normalizedKey, new Set());
    }

    const chainPath = path.join(root, file);
    if (!fs.existsSync(chainPath)) {
      fail(`registry/index.json: missing chain file '${file}'`);
      continue;
    }

    const chainDoc = readJson(chainPath);
    if (!chainDoc) continue;
    if (chainDoc.chain !== key) {
      fail(`${file}: top-level 'chain' must be '${key}'`);
    }
    validateChainNetwork(chainDoc.network, file);
    validateChainStaking(chainDoc.staking, file);

    if (!Array.isArray(chainDoc.tokens)) {
      fail(`${file}: missing tokens[]`);
      continue;
    }

    for (const token of chainDoc.tokens) {
      validateToken(token, file, ids, symbols, key);
      const identifier = normalizeRef(getTokenIdentifier(token));
      if (identifier) {
        chainTokenIdentifiers.get(normalizedKey).add(identifier);
      }
    }
  }

  for (const key of publicChains.keys()) {
    if (!chainKeys.has(key)) {
      fail(`index.json declares chain '${key}' but registry/index.json does not`);
    }
  }

  validateDexRegistry(chainKeys);
  validateProposalsRegistry(chainKeys, chainTokenIdentifiers);
  validateApplicationConfig(chainKeys, chainTokenIdentifiers);
  validatePaymentsConfig(chainKeys, chainTokenIdentifiers, ids);

  if (process.exitCode) return;
  console.log("Registry validation passed.");
}

main();
