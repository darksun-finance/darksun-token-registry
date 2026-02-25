import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const indexPath = path.join(root, "registry", "index.json");

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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
    console.warn(`WARN: duplicate symbol+type detected '${symbolKey}'`);
  }
  symbols.add(symbolKey);

  const logoPath = path.join(root, token.logoURI || "");
  if (!fs.existsSync(logoPath)) fail(`${sourceName}: logoURI does not exist '${token.logoURI}'`);
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

  if (process.exitCode) return;
  console.log("Registry validation passed.");
}

main();
