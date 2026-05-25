import { useQuery } from "@tanstack/react-query";
import {
  getDashboardSummary,
  getCashRate,
  getCPI,
  getEmployment,
  getGDP,
  getRBASchedule,
  getBudgetData,
} from "@/services/api";

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: getDashboardSummary,
    staleTime: STALE_TIME,
    retry: 2,
  });
}

export function useCashRate() {
  return useQuery({
    queryKey: ["dashboard", "cash-rate"],
    queryFn: getCashRate,
    staleTime: STALE_TIME,
    retry: 2,
    select: (res) => res.data,
  });
}

export function useCPI() {
  return useQuery({
    queryKey: ["dashboard", "cpi"],
    queryFn: getCPI,
    staleTime: STALE_TIME,
    retry: 2,
    select: (res) => res.data,
  });
}

export function useEmployment() {
  return useQuery({
    queryKey: ["dashboard", "employment"],
    queryFn: getEmployment,
    staleTime: STALE_TIME,
    retry: 2,
    select: (res) => res.data,
  });
}

export function useGDP() {
  return useQuery({
    queryKey: ["dashboard", "gdp"],
    queryFn: getGDP,
    staleTime: STALE_TIME,
    retry: 2,
    select: (res) => res.data,
  });
}

export function useRBASchedule() {
  return useQuery({
    queryKey: ["dashboard", "rba-schedule"],
    queryFn: getRBASchedule,
    staleTime: 60 * 60 * 1000, // 1 hour — schedule rarely changes
    retry: 1,
  });
}

export function useBudget() {
  return useQuery({
    queryKey: ["dashboard", "budget"],
    queryFn: getBudgetData,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours — only changes at budget/MYEFO
    retry: 1,
  });
}
