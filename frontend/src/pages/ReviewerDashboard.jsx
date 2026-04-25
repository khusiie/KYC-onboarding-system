import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getQueue, getMetrics } from '../api/api';
import { Users, Clock, CheckCircle, AlertTriangle, ArrowRight, Loader2, LogOut } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ReviewerDashboard = () => {
  const [queue, setQueue] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [queueRes, metricsRes] = await Promise.all([getQueue(), getMetrics()]);
      setQueue(queueRes.data);
      setMetrics(metricsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-primary-600 p-2 rounded-lg">
            <CheckCircle className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">Playto <span className="text-primary-600">Review</span></span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm font-bold text-slate-800">{localStorage.getItem('username')}</p>
            <p className="text-xs text-slate-500 capitalize">{localStorage.getItem('role')}</p>
          </div>
          <button 
            onClick={() => { localStorage.clear(); window.location.href='/login'; }}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">LIVE</span>
            </div>
            <p className="text-3xl font-black text-slate-800">{metrics?.submissions_in_queue || 0}</p>
            <p className="text-sm font-medium text-slate-500 mt-1">Pending Submissions</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <Clock className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-400">7D AVG</span>
            </div>
            <p className="text-3xl font-black text-slate-800">{metrics?.average_review_time_hours || 0}h</p>
            <p className="text-sm font-medium text-slate-500 mt-1">Time to Review</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-50 rounded-lg text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-400">7D RATE</span>
            </div>
            <p className="text-3xl font-black text-slate-800">{metrics?.approval_rate_7d || 0}%</p>
            <p className="text-sm font-medium text-slate-500 mt-1">Approval Rate</p>
          </div>
        </div>

        {/* Queue Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Review Queue</h2>
            <div className="flex gap-2">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-300" /> Normal
              </span>
              <span className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" /> At Risk (SLA)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-8 py-4">Merchant</th>
                  <th className="px-8 py-4">Submitted At</th>
                  <th className="px-8 py-4">Time in Queue</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-12 text-center text-slate-400 font-medium">
                      All caught up! The queue is empty.
                    </td>
                  </tr>
                ) : (
                  queue.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-5">
                        <div>
                          <p className="font-bold text-slate-800">{item.business_name || item.merchant_name}</p>
                          <p className="text-xs text-slate-500">{item.email}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm text-slate-600">
                        {new Date(item.submitted_at).toLocaleString()}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${item.is_at_risk ? 'text-amber-600' : 'text-slate-600'}`}>
                            {formatDistanceToNow(new Date(item.submitted_at))}
                          </span>
                          {item.is_at_risk && (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase">
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <Link 
                          to={`/reviewer/submission/${item.id}`}
                          className="flex items-center gap-1 text-primary-600 font-bold text-sm group-hover:gap-2 transition-all"
                        >
                          Review <ArrowRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReviewerDashboard;
