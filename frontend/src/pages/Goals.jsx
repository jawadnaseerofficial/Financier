import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { Target, TrendingUp, Calendar, DollarSign } from 'lucide-react'

function Goals() {
  const [goals, setGoals] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [goalsData, summaryData] = await Promise.all([
        api.getGoals(),
        api.getGoalsSummary()
      ])
      setGoals(goalsData)
      setSummary(summaryData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading goals...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-danger">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Goals</h1>
          <p className="text-text-secondary mt-1">Track your financial goals</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
            + Add Goal
          </button>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="bg-bg-card border border-border rounded-xl p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Target size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">Overall Progress</p>
              <div className="flex items-center space-x-4 mt-1">
                <p className="text-2xl font-bold text-text-primary">
                  ${summary.totalSaved.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-text-muted">of</span>
                <p className="text-lg font-semibold text-text-secondary">
                  ${summary.totalTarget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-bg-dark rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full"
                style={{ width: `${summary.totalTarget > 0 ? Math.round((summary.totalSaved / summary.totalTarget) * 100) : 0}%` }}
              ></div>
            </div>
            <p className="text-sm text-text-muted mt-2">
              {summary.totalTarget > 0 ? Math.round((summary.totalSaved / summary.totalTarget) * 100) : 0}% complete
            </p>
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => {
          const isSaveUp = goal.type === 'save-up'

          return (
            <div key={goal.id} className="bg-bg-card border border-border rounded-xl p-4 hover:bg-bg-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isSaveUp ? 'bg-primary/10' : 'bg-danger/10'
                  }`}>
                    {isSaveUp ? (
                      <TrendingUp size={20} className="text-primary" />
                    ) : (
                      <DollarSign size={20} className="text-danger" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{goal.name}</p>
                    <p className="text-xs text-text-muted capitalize">
                      {goal.type.replace('-', ' ')}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isSaveUp ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'
                }`}>
                  {isSaveUp ? 'Save Up' : 'Pay Down'}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-text-secondary">Progress</span>
                    <span className="text-text-primary font-medium">{goal.percentComplete}%</span>
                  </div>
                  <div className="w-full bg-bg-dark rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        isSaveUp ? 'bg-primary' : 'bg-danger'
                      }`}
                      style={{ width: `${Math.min(goal.percentComplete, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-text-muted">Current</p>
                    <p className="text-text-primary font-medium">
                      ${parseFloat(goal.current).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-text-muted">Target</p>
                    <p className="text-text-primary font-medium">
                      ${parseFloat(goal.target).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1 text-text-muted">
                    <Calendar size={14} />
                    <span>Deadline: {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'No deadline'}</span>
                  </div>
                  <span className="text-text-muted">
                    ${parseFloat(goal.monthly_contribution).toLocaleString()}/mo
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Goals
