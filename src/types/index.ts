export interface StatsResult {
  here: number;
  now: number;
  domain: string;
  path: string;
}

export interface QueryResult {
  here_count: bigint;
  now_count: bigint;
}

export interface TrackingRequest {
  domain: string;
  path: string;
  user_id?: string;
  session_id?: string;
}
