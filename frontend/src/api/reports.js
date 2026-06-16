import client from './client'

export function getReportSummary(params = {}) {
  return client.get('/api/v1/businesses/me/reports/summary/', { params })
}
