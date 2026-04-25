import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getSubmissionDetail, takeAction } from '../api/api';
import { ArrowLeft, Check, X, Info, Download, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const SubmissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      const { data } = await getSubmissionDetail(id);
      setSubmission(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (status) => {
    if (status === 'rejected' && !reason) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setActionLoading(true);
    try {
      await takeAction(id, { 
        new_status: status,
        rejection_reason: reason
      });
      const message = status === 'approved' ? 'KYC Approved Successfully!' : 
                      status === 'rejected' ? 'KYC Rejected Successfully!' :
                      'Information Requested Successfully!';
      toast.success(message);
      navigate('/reviewer');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/reviewer" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Queue
          </Link>
          <div className="flex items-center gap-4">
            <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase ${submission.is_at_risk ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
              {submission.status.replace('_', ' ')} {submission.is_at_risk && '• AT RISK'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Data */}
        <div className="lg:col-span-2 space-y-8">
          {/* Merchant Info */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary-600" /> Merchant Details
            </h2>
            <div className="grid md:grid-cols-2 gap-y-6 gap-x-12">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
                <p className="font-semibold text-slate-800">{submission.full_name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Email</label>
                <p className="font-semibold text-slate-800">{submission.email || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Phone</label>
                <p className="font-semibold text-slate-800">{submission.phone_number || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Business Name</label>
                <p className="font-semibold text-slate-800">{submission.business_name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Business Type</label>
                <p className="font-semibold text-slate-800">{submission.business_type || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Monthly Volume</label>
                <p className="font-semibold text-slate-800">${submission.expected_monthly_volume || '0'}</p>
              </div>
            </div>
          </section>

          {/* Documents */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Uploaded Documents</h2>
            <div className="space-y-4">
              {submission.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <Download className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{doc.document_type.replace('_', ' ')}</p>
                      <p className="text-xs text-slate-400">Uploaded on {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <a 
                    href={doc.file} 
                    target="_blank" 
                    rel="noreferrer"
                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-primary-600 hover:bg-primary-50 transition-colors"
                  >
                    View File
                  </a>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Actions */}
        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sticky top-28">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Decision</h2>
            
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Rejection Reason / Notes</label>
              <textarea
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all h-32 resize-none"
                placeholder="Required for Rejection or More Info Requested..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => handleAction('approved')}
                disabled={actionLoading}
                className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" /> Approve KYC
              </button>
              
              <button 
                onClick={() => handleAction('rejected')}
                disabled={actionLoading}
                className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" /> Reject Submission
              </button>

              <button 
                onClick={() => handleAction('more_info_requested')}
                disabled={actionLoading}
                className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <AlertCircle className="w-5 h-5" /> Request More Info
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-xs text-slate-400 text-center leading-relaxed">
                Actions are permanent and will be logged in the notification system. Merchant will be notified immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetail;
