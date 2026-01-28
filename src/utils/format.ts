/**
 * Number Formatting Utilities
 */

import { BALANCE } from '../config/balance';

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

export function formatNumber(value: number, decimals: number = BALANCE.formatting.decimalPlaces): string {
  if (value === 0) return '0';
  if (!isFinite(value)) return '∞';
  if (isNaN(value)) return 'NaN';

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  // Very small numbers
  if (absValue < 0.01 && absValue > 0) {
    return sign + absValue.toExponential(decimals);
  }

  // Small numbers
  if (absValue < 1000) {
    return sign + absValue.toFixed(decimals).replace(/\.?0+$/, '');
  }

  // Use suffixes for reasonable numbers
  if (absValue < BALANCE.formatting.scientificThreshold) {
    const tier = Math.floor(Math.log10(absValue) / 3);
    if (tier < SUFFIXES.length) {
      const scaled = absValue / Math.pow(1000, tier);
      return sign + scaled.toFixed(decimals).replace(/\.?0+$/, '') + SUFFIXES[tier];
    }
  }

  // Scientific notation for large numbers
  const exp = Math.floor(Math.log10(absValue));
  const mantissa = absValue / Math.pow(10, exp);
  return sign + mantissa.toFixed(decimals) + 'e' + exp;
}

export function formatPercent(value: number, decimals: number = 1): string {
  return (value * 100).toFixed(decimals) + '%';
}

export function formatTime(ms: number): string {
  if (ms < 0) return '0s';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

export function formatTimeShort(ms: number): string {
  if (ms < 0) return '0s';

  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;

  const hours = Math.floor(minutes / 60);
  return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function formatRate(perSecond: number): string {
  if (perSecond >= 1) {
    return formatNumber(perSecond) + '/s';
  }
  if (perSecond > 0) {
    const perMinute = perSecond * 60;
    if (perMinute >= 1) {
      return formatNumber(perMinute) + '/m';
    }
    const perHour = perSecond * 3600;
    return formatNumber(perHour) + '/h';
  }
  return '0/s';
}
