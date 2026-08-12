// ---------------------------------------------------------------------------
// Regions a Seonbae family is likely to be studying in. Used for two things:
// showing an approximate local price next to the won price, and showing what
// a Seoul lesson time means where the visitor actually lives.
//
// Billing is always in KRW. Rates below are approximate and only ever shown as
// a guide, so a stale rate can never become a wrong invoice. Refresh them when
// convenient and bump RATES_UPDATED.
// ---------------------------------------------------------------------------

export const RATES_UPDATED = '2026-08-11';

export interface Region {
  code: string;
  country: string;
  currency: string;
  symbol: string;
  /** How many KRW make one unit of this currency. */
  krwPerUnit: number;
  /** IANA zone, used with Intl so the clock is always right. */
  timezone: string;
  /** Decimal places to show. */
  decimals: number;
}

export const regions: Region[] = [
  { code: 'KR', country: 'South Korea', currency: 'KRW', symbol: '₩', krwPerUnit: 1, timezone: 'Asia/Seoul', decimals: 0 },
  { code: 'US', country: 'United States', currency: 'USD', symbol: '$', krwPerUnit: 1380, timezone: 'America/New_York', decimals: 0 },
  { code: 'CN', country: 'China', currency: 'CNY', symbol: '¥', krwPerUnit: 190, timezone: 'Asia/Shanghai', decimals: 0 },
  { code: 'PH', country: 'Philippines', currency: 'PHP', symbol: '₱', krwPerUnit: 24, timezone: 'Asia/Manila', decimals: 0 },
  { code: 'MY', country: 'Malaysia', currency: 'MYR', symbol: 'RM', krwPerUnit: 310, timezone: 'Asia/Kuala_Lumpur', decimals: 0 },
  { code: 'ID', country: 'Indonesia', currency: 'IDR', symbol: 'Rp', krwPerUnit: 0.085, timezone: 'Asia/Jakarta', decimals: 0 },
  { code: 'GT', country: 'Guatemala', currency: 'GTQ', symbol: 'Q', krwPerUnit: 178, timezone: 'America/Guatemala', decimals: 0 },
  { code: 'MX', country: 'Mexico', currency: 'MXN', symbol: 'MX$', krwPerUnit: 74, timezone: 'America/Mexico_City', decimals: 0 },
];

export const DEFAULT_REGION = 'KR';

export const findRegion = (code: string): Region =>
  regions.find((r) => r.code === code) ?? regions[0];
