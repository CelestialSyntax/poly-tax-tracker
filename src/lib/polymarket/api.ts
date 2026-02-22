import type {
  PolymarketTrade,
  PolymarketTradesResponse,
  PolymarketMarket,
  PolymarketPosition,
  DataApiActivity,
  DataApiPosition,
} from "./types";

const CLOB_BASE_URL = "https://clob.polymarket.com";
const GAMMA_BASE_URL = "https://gamma-api.polymarket.com";
const DATA_API_BASE_URL = "https://data-api.polymarket.com";

const RATE_LIMIT_MS = 200;
let lastRequestTime = 0;

async function rateLimitedFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, RATE_LIMIT_MS - elapsed)
    );
  }
  lastRequestTime = Date.now();

  const res = await fetch(url, init);

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get("retry-after") ?? "2", 10);
    await new Promise((resolve) =>
      setTimeout(resolve, retryAfter * 1000)
    );
    lastRequestTime = Date.now();
    return fetch(url, init);
  }

  return res;
}

export class PolymarketClient {
  /**
   * Fetch trades for a wallet address with pagination.
   */
  async fetchTrades(walletAddress: string, limit = 100): Promise<PolymarketTrade[]> {
    const allTrades: PolymarketTrade[] = [];
    let cursor: string | undefined;

    do {
      const params = new URLSearchParams({
        maker_address: walletAddress,
        limit: String(limit),
      });
      if (cursor) params.set("next_cursor", cursor);

      const response = await rateLimitedFetch(`${CLOB_BASE_URL}/trades?${params}`);
      if (!response.ok) {
        throw new Error(`Polymarket API error: ${response.status}`);
      }

      const data: PolymarketTradesResponse = await response.json();
      allTrades.push(...data.data);
      cursor = data.next_cursor;
    } while (cursor);

    return allTrades;
  }

  /**
   * Fetch market info by condition ID.
   */
  async fetchMarket(conditionId: string): Promise<PolymarketMarket> {
    const response = await rateLimitedFetch(
      `${GAMMA_BASE_URL}/markets/${conditionId}`
    );
    if (!response.ok) {
      throw new Error(`Market API error: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Fetch multiple markets (batch), returning a map keyed by condition ID.
   */
  async fetchMarkets(conditionIds: string[]): Promise<Map<string, PolymarketMarket>> {
    const markets = new Map<string, PolymarketMarket>();
    const unique = [...new Set(conditionIds)];
    await Promise.all(
      unique.map(async (id) => {
        try {
          const market = await this.fetchMarket(id);
          markets.set(id, market);
        } catch {
          /* skip failed fetches */
        }
      })
    );
    return markets;
  }

  /**
   * Fetch open positions for a wallet address.
   */
  async fetchPositions(address: string): Promise<PolymarketPosition[]> {
    const res = await rateLimitedFetch(
      `${CLOB_BASE_URL}/positions?address=${encodeURIComponent(address)}`
    );
    if (!res.ok) {
      throw new Error(`Polymarket API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  /**
   * Fetch activity for a wallet address with offset-based pagination.
   */
  async fetchActivity(address: string): Promise<DataApiActivity[]> {
    const allActivity: DataApiActivity[] = [];
    const limit = 500;
    let offset = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const params = new URLSearchParams({
        user: address,
        limit: String(limit),
        offset: String(offset),
      });

      const res = await rateLimitedFetch(`${DATA_API_BASE_URL}/activity?${params}`);
      if (!res.ok) {
        throw new Error(`Polymarket Data API error: ${res.status} ${res.statusText}`);
      }

      const page: DataApiActivity[] = await res.json();
      allActivity.push(...page);

      if (page.length < limit) break;
      offset += limit;
    }

    return allActivity;
  }

  /**
   * Fetch current positions for a wallet from the Data API.
   */
  async fetchDataApiPositions(address: string): Promise<DataApiPosition[]> {
    const params = new URLSearchParams({ user: address });
    const res = await rateLimitedFetch(`${DATA_API_BASE_URL}/positions?${params}`);
    if (!res.ok) {
      throw new Error(`Polymarket Data API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }
}

export const polymarketClient = new PolymarketClient();

// ─── Legacy function exports (used by transactions/import) ───

/**
 * Fetch market info by condition ID.
 */
export async function fetchMarketInfo(
  conditionId: string
): Promise<PolymarketMarket | null> {
  try {
    return await polymarketClient.fetchMarket(conditionId);
  } catch {
    return null;
  }
}

/**
 * Search markets by query string.
 */
export async function searchMarkets(
  query: string,
  limit = 10
): Promise<PolymarketMarket[]> {
  const params = new URLSearchParams({
    _limit: limit.toString(),
    active: "true",
    closed: "false",
    _q: query,
  });
  const res = await rateLimitedFetch(`${GAMMA_BASE_URL}/markets?${params}`);
  if (!res.ok) return [];
  return res.json();
}

/**
 * Fetch trades for a given maker address (single page).
 */
export async function fetchTradesForWallet(
  address: string,
  limit = 500,
  cursor?: string
): Promise<{ trades: PolymarketTrade[]; next_cursor?: string }> {
  const params = new URLSearchParams({
    maker_address: address,
    limit: limit.toString(),
  });
  if (cursor) params.set("cursor", cursor);

  const res = await rateLimitedFetch(`${CLOB_BASE_URL}/trades?${params}`);
  if (!res.ok) {
    throw new Error(`Polymarket API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch all trades paginating through results.
 */
export async function fetchAllTradesForWallet(
  address: string
): Promise<PolymarketTrade[]> {
  return polymarketClient.fetchTrades(address, 500);
}

/**
 * Fetch open positions for a wallet address.
 */
export async function fetchOpenPositions(
  address: string
): Promise<PolymarketPosition[]> {
  return polymarketClient.fetchPositions(address);
}

/**
 * Fetch all activity for a wallet address, paginating through results.
 */
export async function fetchActivityForWallet(
  address: string
): Promise<DataApiActivity[]> {
  return polymarketClient.fetchActivity(address);
}

/**
 * Fetch current positions from the Data API (works with EOA addresses).
 */
export async function fetchCurrentPositions(
  address: string
): Promise<DataApiPosition[]> {
  return polymarketClient.fetchDataApiPositions(address);
}
