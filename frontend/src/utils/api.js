function getToken() {
  return localStorage.getItem('financier-token')
}

async function fetchApi(endpoint, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`/api${endpoint}`, { ...options, headers })

  if (response.status === 401) {
    localStorage.removeItem('financier-token')
    window.location.reload()
    throw new Error('Session expired')
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `API error: ${response.status}`)
  }

  return response.json()
}

function unwrap(promise) {
  return promise.then(res => res.data !== undefined ? res.data : res)
}

function qs(params = {}) {
  const filtered = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  return filtered.length ? '?' + new URLSearchParams(filtered).toString() : ''
}

export const api = {
  getDashboard: () => unwrap(fetchApi('/dashboard')),

  getAccounts: (params) => unwrap(fetchApi('/accounts' + qs(params))),
  getAccountsGrouped: () => unwrap(fetchApi('/accounts/grouped')),
  getAccountSummary: () => unwrap(fetchApi('/accounts/summary')),
  getNetWorthHistory: (range) => unwrap(fetchApi('/accounts/net-worth-history' + qs({ range }))),
  getAccount: (id) => unwrap(fetchApi(`/accounts/${id}`)),
  createAccount: (data) => unwrap(fetchApi('/accounts', { method: 'POST', body: JSON.stringify(data) })),
  updateAccount: (id, data) => unwrap(fetchApi(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) })),
  deleteAccount: (id) => unwrap(fetchApi(`/accounts/${id}`, { method: 'DELETE' })),

  getTransactions: (params) => fetchApi('/transactions' + qs(params)),
  getTransactionSummary: () => unwrap(fetchApi('/transactions/summary')),
  getTransaction: (id) => unwrap(fetchApi(`/transactions/${id}`)),
  createTransaction: (data) => unwrap(fetchApi('/transactions', { method: 'POST', body: JSON.stringify(data) })),
  updateTransaction: (id, data) => unwrap(fetchApi(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) })),
  deleteTransaction: (id) => unwrap(fetchApi(`/transactions/${id}`, { method: 'DELETE' })),
  bulkUpdateTransactions: (data) => unwrap(fetchApi('/transactions/bulk-update', { method: 'PUT', body: JSON.stringify(data) })),
  exportTransactions: (params) => fetchApi('/transactions/export' + qs(params)),

  getBudgets: (params) => unwrap(fetchApi('/budgets' + qs(params))),
  getBudgetSummary: (params) => unwrap(fetchApi('/budgets/summary' + qs(params))),
  getBudget: (id) => unwrap(fetchApi(`/budgets/${id}`)),
  getBudgetTransactions: (id, params) => unwrap(fetchApi(`/budgets/${id}/transactions` + qs(params))),
  getBudgetForecast: (params) => unwrap(fetchApi('/budgets/forecast' + qs(params))),
  createBudget: (data) => unwrap(fetchApi('/budgets', { method: 'POST', body: JSON.stringify(data) })),
  updateBudget: (id, data) => unwrap(fetchApi(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify(data) })),
  deleteBudget: (id) => unwrap(fetchApi(`/budgets/${id}`, { method: 'DELETE' })),

  getRecurring: (params) => unwrap(fetchApi('/recurring' + qs(params))),
  getRecurringSummary: () => unwrap(fetchApi('/recurring/summary')),
  getRecurringUpcoming: () => unwrap(fetchApi('/recurring/upcoming')),
  getRecurringItem: (id) => unwrap(fetchApi(`/recurring/${id}`)),
  createRecurring: (data) => unwrap(fetchApi('/recurring', { method: 'POST', body: JSON.stringify(data) })),
  updateRecurring: (id, data) => unwrap(fetchApi(`/recurring/${id}`, { method: 'PUT', body: JSON.stringify(data) })),
  deleteRecurring: (id) => unwrap(fetchApi(`/recurring/${id}`, { method: 'DELETE' })),
  toggleRecurring: (id) => unwrap(fetchApi(`/recurring/${id}/toggle`, { method: 'PUT' })),

  getGoals: (params) => unwrap(fetchApi('/goals' + qs(params))),
  getGoalsSummary: () => unwrap(fetchApi('/goals/summary')),
  getGoal: (id) => unwrap(fetchApi(`/goals/${id}`)),
  createGoal: (data) => unwrap(fetchApi('/goals', { method: 'POST', body: JSON.stringify(data) })),
  updateGoal: (id, data) => unwrap(fetchApi(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) })),
  deleteGoal: (id) => unwrap(fetchApi(`/goals/${id}`, { method: 'DELETE' })),
  contributeGoal: (id, data) => unwrap(fetchApi(`/goals/${id}/contribute`, { method: 'POST', body: JSON.stringify(data) })),

  getInvestments: (params) => unwrap(fetchApi('/investments' + qs(params))),
  getInvestmentsSummary: () => unwrap(fetchApi('/investments/summary')),
  getInvestmentAllocation: () => unwrap(fetchApi('/investments/allocation')),
  getInvestment: (id) => unwrap(fetchApi(`/investments/${id}`)),
  createInvestment: (data) => unwrap(fetchApi('/investments', { method: 'POST', body: JSON.stringify(data) })),
  updateInvestment: (id, data) => unwrap(fetchApi(`/investments/${id}`, { method: 'PUT', body: JSON.stringify(data) })),
  deleteInvestment: (id) => unwrap(fetchApi(`/investments/${id}`, { method: 'DELETE' })),

  getReportFilters: () => unwrap(fetchApi('/reports/filters')),
  getCashFlow: (params) => unwrap(fetchApi('/reports/cashflow' + qs(params))),
  getSpendingReport: (params) => unwrap(fetchApi('/reports/spending' + qs(params))),
  getIncomeReport: (params) => unwrap(fetchApi('/reports/income' + qs(params))),
  getMonthlyComparison: (params) => unwrap(fetchApi('/reports/monthly-comparison' + qs(params))),

  getSettings: () => unwrap(fetchApi('/settings')),
  updateSetting: (key, value) => unwrap(fetchApi('/settings', { method: 'PUT', body: JSON.stringify({ key, value }) })),

  getRules: () => unwrap(fetchApi('/rules')),
  createRule: (data) => unwrap(fetchApi('/rules', { method: 'POST', body: JSON.stringify(data) })),
  updateRule: (id, data) => unwrap(fetchApi(`/rules/${id}`, { method: 'PUT', body: JSON.stringify(data) })),
  deleteRule: (id) => unwrap(fetchApi(`/rules/${id}`, { method: 'DELETE' })),
  applyRules: () => unwrap(fetchApi('/rules/apply', { method: 'POST' })),

  getCategories: () => unwrap(fetchApi('/categories')),
  createCategory: (data) => unwrap(fetchApi('/categories', { method: 'POST', body: JSON.stringify(data) })),
  updateCategory: (id, data) => unwrap(fetchApi(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) })),
  deleteCategory: (id) => unwrap(fetchApi(`/categories/${id}`, { method: 'DELETE' })),

  askAI: (question) => unwrap(fetchApi('/ai', { method: 'POST', body: JSON.stringify({ question }) })),
}
