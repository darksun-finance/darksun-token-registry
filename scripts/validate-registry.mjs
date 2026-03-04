import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const indexPath = path.join(root, "registry", "index.json");
const chainsDir = path.join(root, "registry", "chains");
const dexDir = path.join(root, "registry", "dex");

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

    const chainPath = path.join(root, file);
    if (!fs.existsSync(chainPath)) {
      fail(`registry/index.json: missing chain file '${file}'`);
      continue;
    }

    const chainDoc = readJson(chainPath);
    if (chainDoc.chain !== key) {
      fail(`${file}: top-level 'chain' must be '${key}'`);
    }
    if (!Array.isArray(chainDoc.tokens)) {
      fail(`${file}: missing tokens[]`);
      continue;
    }

    for (const token of chainDoc.tokens) {
      validateToken(token, file, ids, symbols, key);
    }
  }

  validateDexRegistry(chainKeys);

  if (process.exitCode) return;
  console.log("Registry validation passed.");
}

main();
