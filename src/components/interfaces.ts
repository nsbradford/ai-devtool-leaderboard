/**
 * Represents a single data point in a time series chart.
 * Contains timestamp information and dynamic properties for tool-specific values.
 */
export interface ChartDataPoint {
  /** Unix timestamp in seconds */
  timestamp: number;
  /** Unix timestamp in milliseconds */
  timestampMs: number;
  /** Additional properties indexed by tool ID or other keys */
  [key: string]: string | number;
}
