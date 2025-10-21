/**
 * Represents a single data point in a chart with dynamic properties.
 */
export interface ChartDataPoint {
  /** Unix timestamp in seconds */
  timestamp: number;
  /** Unix timestamp in milliseconds */
  timestampMs: number;
  /** Additional dynamic properties (e.g., tool-specific data) */
  [key: string]: string | number;
}
