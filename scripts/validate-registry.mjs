import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const indexPath = path.join(root, "registry", "index.json");
const chainsDir = path.join(root, "registry", "chains");
const dexDir = path.join(root, "registry", "dex");
const proposalsDir = path.join(root, "registry", "proposals");

const TERRA_CONTRACT_RE = /^terra1[0-9a-z]{20,}$/;

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
}

function warn(message) {
  console.warn(`WARN: ${message}`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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

  if (!lcd.length) {
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
    }
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

function main() {
  if (!fs.existsSync(indexPath)) {
    fail("registry/index.json not found");
    return;
  }

  const index = readJson(indexPath);
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
    if (chainDoc.chain !== key) {
      fail(`${file}: top-level 'chain' must be '${key}'`);
    }
    validateChainNetwork(chainDoc.network, file);

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

  validateDexRegistry(chainKeys);
  validateProposalsRegistry(chainKeys, chainTokenIdentifiers);

  if (process.exitCode) return;
  console.log("Registry validation passed.");
}

main();
