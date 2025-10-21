// Copyright 2025 Anysphere Inc.
export interface ChartDataPoint {
  timestamp: number;
  timestampMs: number;
  [key: string]: string | number;
}
