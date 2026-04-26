import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getQueue, getMetrics } from '../api/api';
import { Users, Clock, CheckCircle, AlertTriangle, ArrowRight, Loader2, LogOut, History, Inbox, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ReviewerDashboard = () => {
  const [queue, setQueue] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [activeTab, setActiveTab] = useState('submitted'); // 'submitted' or 'history'

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchData = async () => {
    setIsFetching(true);
    try {
      const [queueRes, metricsRes] = await Promise.all([
        getQueue(activeTab), 
        getMetrics()
      ]);
      setQueue(queueRes.data);
      setMetrics(metricsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-green-100 flex items-center gap-1 w-fit"><Check className="w-3 h-3" /> Approved</span>;
      case 'rejected': return <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-red-100 flex items-center gap-1 w-fit"><X className="w-3 h-3" /> Rejected</span>;
      case 'more_info_requested': return <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-amber-100 flex items-center gap-1 w-fit">More Info</span>;
      default: return <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-blue-100 w-fit">Pending</span>;
    }
  };

  if (loading && queue.length === 0) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-normal">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-primary-600 p-2 rounded-lg">
            <CheckCircle className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-semibold text-slate-800 tracking-tight">Playto <span className="text-primary-600">Review</span></span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-800">{localStorage.getItem('username')}</p>
            <p className="text-xs text-slate-500 capitalize">{localStorage.getItem('role')}</p>
          </div>
          <button onClick={() => { localStorage.clear(); window.location.href='/login'; }} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4 text-blue-600">
              <div className="p-2 bg-blue-50 rounded-lg"><Users className="w-6 h-6" /></div>
              <span className="text-[10px] font-semibold bg-blue-50 px-2 py-1 rounded-full uppercase tracking-wider">Live Queue</span>
            </div>
            <p className="text-3xl font-medium text-slate-800">{metrics?.submissions_in_queue || 0}</p>
            <p className="text-sm font-normal text-slate-500 mt-1">Pending Items</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4 text-amber-600">
              <div className="p-2 bg-amber-50 rounded-lg"><Clock className="w-6 h-6" /></div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">7D AVG</span>
            </div>
            <p className="text-3xl font-medium text-slate-800">{metrics?.average_review_time_hours || 0}h</p>
            <p className="text-sm font-normal text-slate-500 mt-1">SLA Benchmark</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4 text-green-600">
              <div className="p-2 bg-green-50 rounded-lg"><CheckCircle className="w-6 h-6" /></div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">7D RATE</span>
            </div>
            <p className="text-3xl font-medium text-slate-800">{metrics?.approval_rate_7d || 0}%</p>
            <p className="text-sm font-normal text-slate-500 mt-1">Total Approval Rate</p>
          </div>
        </div>

        {/* Tabs Control */}
        <div className="flex gap-1 bg-slate-200/50 p-1 rounded-xl w-fit mb-6">
          <button 
            onClick={() => { setActiveTab('submitted'); }}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'submitted' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Inbox className="w-4 h-4" /> Pending Queue
          </button>
          <button 
            onClick={() => { setActiveTab('history'); }}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <History className="w-4 h-4" /> Processed History
          </button>
        </div>

        {/* Queue/History Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-medium text-slate-800 tracking-tight">
                {activeTab === 'submitted' ? 'Submissions Awaiting Review' : 'Process History'}
              </h2>
              {isFetching && <Loader2 className="w-4 h-4 animate-spin text-primary-600" />}
            </div>
            {activeTab === 'submitted' && (
              <div className="flex gap-4">
                <span className="text-[10px] font-medium uppercase text-slate-400 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Standard</span>
                <span className="text-[10px] font-medium uppercase text-amber-500 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Priority (24h+)</span>
              </div>
            )}
          </div>

          <div className={`overflow-x-auto transition-opacity duration-200 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-semibold uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-4">Merchant Details</th>
                  <th className="px-8 py-4">Event Time</th>
                  <th className="px-8 py-4">Wait/Duration</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center">
                      <div className="max-w-xs mx-auto">
                        <Inbox className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium">No items found in this section.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  queue.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center font-medium text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors text-sm">
                            {(item.business_name || item.merchant_name || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-700 group-hover:text-primary-700 transition-colors">{item.business_name || item.merchant_name}</p>
                            <p className="text-[11px] text-slate-400 font-normal">{item.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-[13px] text-slate-500 font-normal">
                        {new Date(item.submitted_at || item.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[13px] font-medium ${item.is_at_risk && activeTab === 'submitted' ? 'text-amber-500' : 'text-slate-500'}`}>
                            {formatDistanceToNow(new Date(item.submitted_at || item.updated_at), { addSuffix: true })}
                          </span>
                          {item.is_at_risk && activeTab === 'submitted' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <Link 
                          to={`/reviewer/submission/${item.id}`}
                          className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 text-slate-600 font-semibold text-[11px] rounded-lg hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all"
                        >
                          {activeTab === 'submitted' ? 'Review' : 'Details'} <ArrowRight className="w-3.5 h-3.5" />
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
