import { useQuery } from '@tanstack/react-query';
import {
  getEarnings,
  getIncomeStatement,
  getBalanceSheet,
  getCashFlow,
  getFinancialRatios,
} from '../services/api';

/** Hook for fetching earnings data */
export function useEarnings(ticker: string) {
  return useQuery({
    queryKey: ['financial', ticker, 'earnings'],
    queryFn: () => getEarnings(ticker),
    enabled: !!ticker,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

/** Hook for fetching income statement */
export function useIncomeStatement(ticker: string, quarterly = false) {
  return useQuery({
    queryKey: ['financial', ticker, 'income', quarterly],
    queryFn: () => getIncomeStatement(ticker, quarterly),
    enabled: !!ticker,
    staleTime: 1000 * 60 * 30,
  });
}

/** Hook for fetching balance sheet */
export function useBalanceSheet(ticker: string, quarterly = false) {
  return useQuery({
    queryKey: ['financial', ticker, 'balance', quarterly],
    queryFn: () => getBalanceSheet(ticker, quarterly),
    enabled: !!ticker,
    staleTime: 1000 * 60 * 30,
  });
}

/** Hook for fetching cash flow */
export function useCashFlow(ticker: string, quarterly = false) {
  return useQuery({
    queryKey: ['financial', ticker, 'cashflow', quarterly],
    queryFn: () => getCashFlow(ticker, quarterly),
    enabled: !!ticker,
    staleTime: 1000 * 60 * 30,
  });
}

/** Hook for fetching financial ratios */
export function useFinancialRatios(ticker: string) {
  return useQuery({
    queryKey: ['financial', ticker, 'ratios'],
    queryFn: () => getFinancialRatios(ticker),
    enabled: !!ticker,
    staleTime: 1000 * 60 * 30,
  });
}
