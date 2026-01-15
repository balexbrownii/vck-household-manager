'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/page-header'
import { toast } from '@/lib/toast'
import {
  Sparkles,
  Briefcase,
  Home,
  CheckCircle,
  Settings,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react'
import RulesEditor from '@/components/rules/rules-editor'
import { LoadingSpinner } from '@/components/ui/shared'

type TabType = 'gigs' | 'chores' | 'expectations' | 'metrics'

interface GigRule {
  id: string
  title: string
  description: string
  tier: number
  stars: number
  checklist: string[]
  scope_description: string | null
  completion_criteria: string | null
  ai_review_enabled: boolean
}

interface ChoreRule {
  id: string
  assignment: string
  day_of_week: number
  room_name: string
  checklist: string[]
  scope_description: string | null
  completion_criteria: string | null
  ai_review_enabled: boolean
}

interface ExpectationRule {
  id: string
  expectation_type: string
  scope_description: string
  completion_criteria: string
  ai_review_enabled: boolean
}

interface AIMetric {
  entity_type: string
  total_reviews: number
  agreements: number
  false_positives: number
  false_negatives: number
  accuracy_rate: number
}

interface Disagreement {
  id: string
  entity_type: string
  signal_type: 'false_positive' | 'false_negative'
  ai_passed: boolean
  ai_confidence: number
  ai_feedback: string
  parent_approved: boolean
  parent_feedback: string | null
  kid_notes: string | null
  created_at: string
}

interface MetricsSummary {
  totalReviews: number
  agreements: number
  falsePositives: number
  falseNegatives: number
  overallAccuracy: number | null
}

export default function RulesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('gigs')
  const [gigs, setGigs] = useState<GigRule[]>([])
  const [chores, setChores] = useState<ChoreRule[]>([])
  const [expectations, setExpectations] = useState<ExpectationRule[]>([])
  const [metrics, setMetrics] = useState<AIMetric[]>([])
  const [disagreements, setDisagreements] = useState<Disagreement[]>([])
  const [metricsSummary, setMetricsSummary] = useState<MetricsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<{
    type: TabType
    item: GigRule | ChoreRule | ExpectationRule
  } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [gigsRes, choresRes, expectationsRes, metricsRes] = await Promise.all([
        fetch('/api/rules/gigs'),
        fetch('/api/rules/chores'),
        fetch('/api/rules/expectations'),
        fetch('/api/rules/metrics'),
      ])

      if (gigsRes.ok) {
        const { gigs } = await gigsRes.json()
        setGigs(gigs || [])
      }
      if (choresRes.ok) {
        const { chores } = await choresRes.json()
        setChores(chores || [])
      }
      if (expectationsRes.ok) {
        const { rules } = await expectationsRes.json()
        setExpectations(rules || [])
      }
      if (metricsRes.ok) {
        const data = await metricsRes.json()
        setMetrics(data.metrics || [])
        setDisagreements(data.recentDisagreements || [])
        setMetricsSummary(data.summary || null)
      }
    } catch {
      toast.error('Failed to load rules')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveGig = async (
    id: string,
    rules: {
      scope_description: string
      completion_criteria: string
      ai_review_enabled: boolean
    }
  ) => {
    const res = await fetch(`/api/rules/gigs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rules),
    })

    if (res.ok) {
      setGigs((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...rules } : g))
      )
      setEditingItem(null)
    }
  }

  const handleSaveChore = async (
    id: string,
    rules: {
      scope_description: string
      completion_criteria: string
      ai_review_enabled: boolean
    }
  ) => {
    const res = await fetch(`/api/rules/chores/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rules),
    })

    if (res.ok) {
      setChores((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...rules } : c))
      )
      setEditingItem(null)
    }
  }

  const handleSaveExpectation = async (
    type: string,
    rules: {
      scope_description: string
      completion_criteria: string
      ai_review_enabled: boolean
    }
  ) => {
    const res = await fetch('/api/rules/expectations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ...rules }),
    })

    if (res.ok) {
      setExpectations((prev) =>
        prev.map((e) =>
          e.expectation_type === type ? { ...e, ...rules } : e
        )
      )
      setEditingItem(null)
    }
  }

  const getDayName = (day: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return days[day] || ''
  }

  const formatExpectationType = (type: string) => {
    const labels: Record<string, string> = {
      exercise: 'Exercise',
      reading: 'Reading',
      tidy_up: 'Tidy Up',
      daily_chore: 'Daily Chore',
    }
    return labels[type] || type
  }

  const getTierLabel = (tier: number) => {
    const labels = ['', 'Easy', 'Moderate', 'Difficult', 'Very Difficult', 'Premium']
    return labels[tier] || ''
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // If editing, show the editor
  if (editingItem) {
    if (editingItem.type === 'gigs') {
      const gig = editingItem.item as GigRule
      return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
          <div className="max-w-2xl mx-auto">
            <RulesEditor
              title={gig.title}
              subtitle={`Tier ${gig.tier} - ${gig.stars} stars`}
              scopeDescription={gig.scope_description || gig.description}
              completionCriteria={gig.completion_criteria || ''}
              aiReviewEnabled={gig.ai_review_enabled}
              checklist={gig.checklist}
              onSave={(rules) => handleSaveGig(gig.id, rules)}
              onCancel={() => setEditingItem(null)}
            />
          </div>
        </div>
      )
    }

    if (editingItem.type === 'chores') {
      const chore = editingItem.item as ChoreRule
      return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
          <div className="max-w-2xl mx-auto">
            <RulesEditor
              title={chore.room_name}
              subtitle={`${chore.assignment} - ${getDayName(chore.day_of_week)}`}
              scopeDescription={chore.scope_description || ''}
              completionCriteria={chore.completion_criteria || ''}
              aiReviewEnabled={chore.ai_review_enabled}
              checklist={chore.checklist}
              onSave={(rules) => handleSaveChore(chore.id, rules)}
              onCancel={() => setEditingItem(null)}
            />
          </div>
        </div>
      )
    }

    if (editingItem.type === 'expectations') {
      const exp = editingItem.item as ExpectationRule
      return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
          <div className="max-w-2xl mx-auto">
            <RulesEditor
              title={formatExpectationType(exp.expectation_type)}
              subtitle="Daily Expectation"
              scopeDescription={exp.scope_description}
              completionCriteria={exp.completion_criteria}
              aiReviewEnabled={exp.ai_review_enabled}
              onSave={(rules) =>
                handleSaveExpectation(exp.expectation_type, rules)
              }
              onCancel={() => setEditingItem(null)}
            />
          </div>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <PageHeader
            title="AI Rules Configuration"
            subtitle="Configure what AI looks for when reviewing submissions"
            backHref="/dashboard/admin"
            backLabel="Back to Admin"
            icon={<Settings className="w-5 h-5 text-purple-600" />}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1">
            {[
              { key: 'gigs', label: 'Gigs', icon: Briefcase, count: gigs.length },
              { key: 'chores', label: 'Chores', icon: Home, count: chores.length },
              { key: 'expectations', label: 'Expectations', icon: CheckCircle, count: expectations.length },
              { key: 'metrics', label: 'AI Metrics', icon: BarChart3, count: metricsSummary?.totalReviews || 0 },
            ].map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as TabType)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === key
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Gigs Tab */}
        {activeTab === 'gigs' && (
          <div className="space-y-3">
            {gigs.map((gig) => (
              <button
                key={gig.id}
                onClick={() => setEditingItem({ type: 'gigs', item: gig })}
                className="w-full bg-white rounded-xl border-2 border-gray-200 p-4 hover:border-purple-300 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{gig.title}</h3>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        {getTierLabel(gig.tier)}
                      </span>
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                        {gig.stars} stars
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-1">
                      {gig.scope_description || gig.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    {gig.ai_review_enabled ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs">AI On</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-400">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs">AI Off</span>
                      </div>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Chores Tab */}
        {activeTab === 'chores' && (
          <div className="space-y-3">
            {chores.map((chore) => (
              <button
                key={chore.id}
                onClick={() => setEditingItem({ type: 'chores', item: chore })}
                className="w-full bg-white rounded-xl border-2 border-gray-200 p-4 hover:border-purple-300 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {chore.room_name}
                      </h3>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {chore.assignment}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {getDayName(chore.day_of_week)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-1">
                      {chore.checklist.slice(0, 3).join(', ')}
                      {chore.checklist.length > 3 && '...'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    {chore.ai_review_enabled ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs">AI On</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-400">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs">AI Off</span>
                      </div>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Expectations Tab */}
        {activeTab === 'expectations' && (
          <div className="space-y-3">
            {expectations.map((exp) => (
              <button
                key={exp.id}
                onClick={() =>
                  setEditingItem({ type: 'expectations', item: exp })
                }
                className="w-full bg-white rounded-xl border-2 border-gray-200 p-4 hover:border-purple-300 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {formatExpectationType(exp.expectation_type)}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-1">
                      {exp.scope_description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    {exp.ai_review_enabled ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs">AI On</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-400">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs">AI Off</span>
                      </div>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Metrics Tab */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            {metricsSummary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-gray-600">Total Reviews</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {metricsSummary.totalReviews}
                  </p>
                </div>
                <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-600">AI Accuracy</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {metricsSummary.overallAccuracy !== null
                      ? `${metricsSummary.overallAccuracy}%`
                      : 'N/A'}
                  </p>
                </div>
                <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                    <span className="text-sm text-gray-600">Too Lenient</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">
                    {metricsSummary.falsePositives}
                  </p>
                  <p className="text-xs text-gray-500">AI passed, parent rejected</p>
                </div>
                <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-600">Too Strict</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {metricsSummary.falseNegatives}
                  </p>
                  <p className="text-xs text-gray-500">AI failed, parent approved</p>
                </div>
              </div>
            )}

            {/* By Entity Type */}
            {metrics.length > 0 && (
              <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Accuracy by Task Type</h3>
                <div className="space-y-3">
                  {metrics.map((metric) => (
                    <div
                      key={metric.entity_type}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {metric.entity_type === 'gig' && <Briefcase className="w-5 h-5 text-purple-600" />}
                        {metric.entity_type === 'chore' && <Home className="w-5 h-5 text-blue-600" />}
                        {metric.entity_type === 'expectation' && <CheckCircle className="w-5 h-5 text-green-600" />}
                        <div>
                          <p className="font-medium capitalize">{metric.entity_type}s</p>
                          <p className="text-sm text-gray-500">
                            {metric.total_reviews} reviews
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {metric.accuracy_rate !== null
                            ? `${Math.round(metric.accuracy_rate)}%`
                            : 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {metric.false_positives} lenient · {metric.false_negatives} strict
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Disagreements */}
            {disagreements.length > 0 && (
              <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Recent AI Learning Signals
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  These disagreements are being used to improve AI accuracy for future evaluations.
                </p>
                <div className="space-y-3">
                  {disagreements.map((d) => (
                    <div
                      key={d.id}
                      className={`p-3 rounded-lg border-l-4 ${
                        d.signal_type === 'false_positive'
                          ? 'border-l-orange-500 bg-orange-50'
                          : 'border-l-blue-500 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          d.signal_type === 'false_positive'
                            ? 'bg-orange-200 text-orange-800'
                            : 'bg-blue-200 text-blue-800'
                        }`}>
                          {d.signal_type === 'false_positive' ? 'AI Too Lenient' : 'AI Too Strict'}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">{d.entity_type}</span>
                      </div>
                      {d.kid_notes && (
                        <p className="text-sm text-gray-700 mb-1">
                          <strong>Kid said:</strong> "{d.kid_notes}"
                        </p>
                      )}
                      <p className="text-sm text-gray-700 mb-1">
                        <strong>AI said:</strong> {d.ai_feedback?.slice(0, 100)}
                        {d.ai_feedback && d.ai_feedback.length > 100 ? '...' : ''}
                      </p>
                      {d.parent_feedback && (
                        <p className="text-sm text-gray-700">
                          <strong>Parent said:</strong> "{d.parent_feedback}"
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(d.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {metricsSummary && metricsSummary.totalReviews === 0 && (
              <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
                <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">No AI Reviews Yet</h3>
                <p className="text-gray-600">
                  AI accuracy metrics will appear here once kids start submitting
                  tasks for review and parents provide feedback.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
