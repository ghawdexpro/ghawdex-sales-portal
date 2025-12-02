'use client';

import { useState, useEffect } from 'react';

interface FunnelStep {
  step: number;
  step_name: string;
  reached: number;
  percentage: number;
  dropoff_count: number;
  dropoff_rate: number;
}

interface AbandonedSession {
  id: string;
  highest_step: number;
  step_name: string;
  address: string | null;
  system: string | null;
  price: number | null;
  created_at: string;
}

interface AnalyticsData {
  summary: {
    total_sessions: number;
    period_days: number;
    converted: number;
    abandoned: number;
    in_progress: number;
    completed: number;
    conversion_rate: number;
    avg_duration_minutes: number;
  };
  funnel: FunnelStep[];
  insights: {
    mobile_percentage: number;
    malta_percentage: number;
    gozo_percentage: number;
    prefilled_percentage: number;
    battery_interest_rate: number;
  };
  popular_systems_abandoned: Record<string, number>;
  traffic_sources: Record<string, number>;
  abandoned_sessions?: AbandonedSession[];
}

const STEP_COLORS: Record<number, string> = {
  1: 'bg-blue-500',
  2: 'bg-cyan-500',
  3: 'bg-green-500',
  4: 'bg-yellow-500',
  5: 'bg-orange-500',
  6: 'bg-red-500',
};

export default function AbandonedSessionsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [days]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/wizard-sessions/analytics?days=${days}&detailed=true`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-8 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const maxReached = Math.max(...data.funnel.map(f => f.reached), 1);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Abandoned Sessions</h1>
            <p className="text-gray-400 mt-1">Track wizard drop-offs and partial leads</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Period:</span>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            >
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-gray-400 text-sm">Total Sessions</div>
            <div className="text-2xl font-bold mt-1">{data.summary.total_sessions}</div>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <div className="text-green-400 text-sm">Converted</div>
            <div className="text-2xl font-bold mt-1 text-green-400">{data.summary.converted}</div>
            <div className="text-green-400/60 text-xs">{data.summary.conversion_rate}% rate</div>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
            <div className="text-orange-400 text-sm">Abandoned</div>
            <div className="text-2xl font-bold mt-1 text-orange-400">{data.summary.abandoned}</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="text-blue-400 text-sm">In Progress</div>
            <div className="text-2xl font-bold mt-1 text-blue-400">{data.summary.in_progress}</div>
          </div>
        </div>

        {/* Funnel Visualization */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-6">Drop-off Funnel</h2>
          <div className="space-y-4">
            {data.funnel.map((step) => (
              <div key={step.step} className="flex items-center gap-4">
                <div className="w-24 sm:w-32 text-sm text-gray-400 flex-shrink-0">
                  <div className="font-medium text-white">Step {step.step}</div>
                  <div className="text-xs">{step.step_name}</div>
                </div>
                <div className="flex-1">
                  <div className="relative h-8 bg-white/5 rounded-lg overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 ${STEP_COLORS[step.step]} opacity-80 transition-all duration-500`}
                      style={{ width: `${(step.reached / maxReached) * 100}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-3 text-sm">
                      <span className="font-medium">{step.reached} reached</span>
                      <span className="text-gray-400">{step.percentage}%</span>
                    </div>
                  </div>
                </div>
                <div className="w-24 text-right flex-shrink-0">
                  {step.dropoff_count > 0 && (
                    <div className="text-orange-400 text-sm">
                      -{step.dropoff_count} ({step.dropoff_rate}%)
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{data.insights.mobile_percentage}%</div>
            <div className="text-gray-400 text-xs mt-1">Mobile Users</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{data.insights.malta_percentage}%</div>
            <div className="text-gray-400 text-xs mt-1">Malta</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{data.insights.gozo_percentage}%</div>
            <div className="text-gray-400 text-xs mt-1">Gozo</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{data.insights.battery_interest_rate}%</div>
            <div className="text-gray-400 text-xs mt-1">Battery Interest</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{data.summary.avg_duration_minutes}m</div>
            <div className="text-gray-400 text-xs mt-1">Avg Duration</div>
          </div>
        </div>

        {/* Abandoned Sessions List */}
        {data.abandoned_sessions && data.abandoned_sessions.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">
              High-Value Abandoned Sessions
              <span className="text-gray-400 text-sm font-normal ml-2">
                (reached Step 2+)
              </span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-left border-b border-white/10">
                    <th className="pb-3 font-medium">Step</th>
                    <th className="pb-3 font-medium">Address</th>
                    <th className="pb-3 font-medium">System</th>
                    <th className="pb-3 font-medium text-right">Price</th>
                    <th className="pb-3 font-medium text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.abandoned_sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-white/5">
                      <td className="py-3">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${STEP_COLORS[session.highest_step]} text-white text-xs font-bold`}>
                          {session.highest_step}
                        </span>
                      </td>
                      <td className="py-3 max-w-[200px] truncate">
                        {session.address || <span className="text-gray-500">No address</span>}
                      </td>
                      <td className="py-3">
                        {session.system || <span className="text-gray-500">Not selected</span>}
                      </td>
                      <td className="py-3 text-right">
                        {session.price ? (
                          <span className="text-green-400">€{session.price.toLocaleString()}</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-3 text-right text-gray-400">
                        {new Date(session.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Traffic Sources */}
        {Object.keys(data.traffic_sources).length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mt-8">
            <h2 className="text-lg font-semibold mb-4">Traffic Sources</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.traffic_sources)
                .sort(([, a], [, b]) => b - a)
                .map(([source, count]) => (
                  <div
                    key={source}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="text-gray-400">{source}:</span>{' '}
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-8">
          Data refreshes automatically. Cron marks sessions as abandoned after 30 minutes of inactivity.
        </div>
      </div>
    </div>
  );
}
