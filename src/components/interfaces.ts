export interface ChartDataPoint {
  timestamp: number;
  timestampMs: number;
  [key: string]: string | number;
}
