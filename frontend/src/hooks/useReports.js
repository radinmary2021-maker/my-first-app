import { useQuery } from '@tanstack/react-query'
import { getReportSummary } from '../api/reports'

export function useReportSummary(params = {}, options = {}) {
  return useQuery({
    queryKey: ['report-summary', params],
    queryFn: () => getReportSummary(params),
    select: (res) => res.data,
    staleTime: 60_000,
    ...options,
  })
}
