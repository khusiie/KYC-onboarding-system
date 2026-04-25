import React, { useState, useEffect } from 'react';
import { getMyKYC, updateMyKYC, submitKYC, uploadDoc, getNotifications } from '../api/api';
import { CheckCircle2, Circle, Upload, Send, FileText, Briefcase, User as UserIcon, Loader2, AlertCircle, Clock, X, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const MerchantFlow = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [kycData, setKycData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    business_name: '',
    business_type: '',
    expected_monthly_volume: '',
    status: 'draft',
    documents: []
  });
  const [uploading, setUploading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [fileError, setFileError] = useState(null);

  useEffect(() => {
    fetchKYC();
  }, []);

  const fetchKYC = async () => {
    try {
      const [{ data: kyc }, { data: notices }] = await Promise.all([
        getMyKYC(),
        getNotifications()
      ]);
      setKycData(kyc);
      setNotifications(notices);
      if (kyc.status !== 'draft' && kyc.status !== 'more_info_requested' && kyc.status !== 'rejected') {
        setStep(4);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await updateMyKYC(kycData);
      setKycData(data);
      toast.success('Details saved!');
      setStep(step + 1);
    } catch (err) {
      toast.error('Error saving details');
    }
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Instant Frontend Validation
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      setFileError({ type, msg: 'Invalid format. Please upload PDF, JPG, or PNG only.' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', type);

    setUploading(true);
    setFileError(null);
    try {
      await uploadDoc(formData);
      toast.success(`${type.replace('_', ' ')} uploaded!`);
      fetchKYC();
    } catch (err) {
      const msg = err.response?.data?.file?.[0] || err.response?.data?.error || 'Error uploading file';
      setFileError({ type, msg });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitKYC();
      toast.success('KYC Submitted Successfully!');
      fetchKYC();
      setStep(4);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error submitting KYC');
    } finally {
      setSubmitting(false);
    }
  };

  const getFriendlyEvent = (event) => {
    const mapping = {
      'STATUS_CHANGED_SUBMITTED': 'Submitted for Review',
      'STATUS_CHANGED_UNDER_REVIEW': 'Review in Progress',
      'STATUS_CHANGED_APPROVED': 'KYC Accepted & Verified',
      'STATUS_CHANGED_REJECTED': 'KYC Rejected',
      'STATUS_CHANGED_MORE_INFO_REQUESTED': 'Information Requested'
    };
    return mapping[event] || event.replace(/_/g, ' ');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
    </div>
  );

  const renderStepIcon = (s) => {
    if (kycData.status === 'submitted' || kycData.status === 'approved' || step > s) {
      return <CheckCircle2 className="w-6 h-6 text-green-500" />;
    }
    if (step === s) return <Circle className="w-6 h-6 text-primary-600 fill-primary-600" />;
    return <Circle className="w-6 h-6 text-slate-300" />;
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      {/* Stepper */}
      <div className="flex justify-between mb-12 relative max-w-4xl mx-auto">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 -z-10" />
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex flex-col items-center bg-slate-50 px-4">
            {renderStepIcon(s)}
            <span className={`text-xs mt-2 font-medium ${step === s ? 'text-primary-600' : 'text-slate-500'}`}>
              {s === 1 ? 'Personal' : s === 2 ? 'Business' : s === 3 ? 'Documents' : 'Status'}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-100">
        {step === 1 && (
          <form onSubmit={handleUpdate} className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <UserIcon className="w-8 h-8 text-primary-600" />
              <h2 className="text-2xl font-bold text-slate-800">Personal Details</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Full Name</label>
                <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" value={kycData.full_name} onChange={(e) => setKycData({ ...kycData, full_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Email Address</label>
                <input type="email" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" value={kycData.email} onChange={(e) => setKycData({ ...kycData, email: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-600 mb-2">Phone Number</label>
                <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" value={kycData.phone_number} onChange={(e) => setKycData({ ...kycData, phone_number: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg">Next: Business Details</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleUpdate} className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Briefcase className="w-8 h-8 text-primary-600" />
              <h2 className="text-2xl font-bold text-slate-800">Business Details</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-600 mb-2">Business Name</label>
                <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" value={kycData.business_name} onChange={(e) => setKycData({ ...kycData, business_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Business Type</label>
                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" value={kycData.business_type} onChange={(e) => setKycData({ ...kycData, business_type: e.target.value })}>
                  <option value="">Select Type</option>
                  <option value="Freelancer">Freelancer</option>
                  <option value="LLP">LLP</option>
                  <option value="Private Limited">Private Limited</option>
                  <option value="Proprietorship">Proprietorship</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Expected Monthly Volume (USD)</label>
                <input type="number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" value={kycData.expected_monthly_volume} onChange={(e) => setKycData({ ...kycData, expected_monthly_volume: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => setStep(1)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-xl">Back</button>
              <button type="submit" className="flex-[2] py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg">Next: Documents</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="space-y-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-8 h-8 text-primary-600" />
              <h2 className="text-2xl font-bold text-slate-800">Identity Documents</h2>
            </div>
            <div className="space-y-4">
              {['PAN', 'AADHAAR', 'BANK_STATEMENT'].map((type) => {
                const doc = kycData.documents.find(d => d.document_type === type);
                return (
                  <div key={type} className="flex flex-col">
                    <div className="flex items-center justify-between p-6 bg-slate-50 border border-dashed border-slate-300 rounded-2xl relative transition-all hover:border-primary-200">
                      <div>
                        <p className="font-bold text-slate-800">{type.replace('_', ' ')}</p>
                        <p className="text-sm text-slate-500">{doc ? (<span className="text-green-600 font-semibold flex items-center gap-1">✅ {doc.file.split('/').pop()}</span>) : ('Required (PDF, JPG, PNG)')}</p>
                      </div>
                      <label className="cursor-pointer bg-white px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all">
                        {doc ? 'Change' : 'Upload'}
                        <input type="file" className="hidden" onChange={(e) => handleFileChange(e, type)} />
                      </label>
                    </div>
                    {fileError && fileError.type === type && (<div className="mt-2 px-1 text-xs text-red-500 font-semibold flex items-center gap-1 animate-bounce"><AlertCircle className="w-3 h-3" /> {fileError.msg}</div>)}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep(2)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-xl">Back</button>
              <button onClick={handleSubmit} disabled={submitting || kycData.documents.length < 3} className="flex-[2] py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="animate-spin" /> : <Send className="w-5 h-5" />} Submit for Review
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            {/* LEFT/CENTER: Status Message */}
            <div className="lg:col-span-2 py-8 text-center lg:text-left border-r border-slate-50 lg:pr-12">
              {kycData.status === 'submitted' || kycData.status === 'under_review' ? (
                <>
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-8 text-primary-600">
                    <Loader2 className="w-10 h-10 animate-spin" />
                  </div>
                  <h2 className="text-4xl font-medium text-slate-700 mb-6 tracking-tight">KYC Under Review</h2>
                  <p className="text-xl text-slate-400 leading-relaxed font-light">Your documents are being verified by our compliance team. This usually takes less than 24 hours.</p>
                </>
              ) : kycData.status === 'approved' ? (
                <>
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-8 text-green-600">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Account Verified!</h2>
                  <p className="text-xl text-slate-500 leading-relaxed font-medium">Congratulations! Your KYC is approved. You can now start collecting international payments.</p>
                </>
              ) : kycData.status === 'more_info_requested' || kycData.status === 'rejected' ? (
                <>
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-8 ${kycData.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                    {kycData.status === 'rejected' ? <X className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
                  </div>
                  <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">{kycData.status === 'rejected' ? 'Application Unsuccessful' : 'More Info Needed'}</h2>
                  <div className={`p-6 rounded-2xl mb-8 text-lg font-semibold italic border ${kycData.status === 'rejected' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
                    "{kycData.rejection_reason || 'Please update your documents.'}"
                  </div>
                  <button onClick={() => setStep(1)} className="px-10 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all">Update & Re-submit</button>
                </>
              ) : null}
            </div>

            {/* RIGHT SIDE: Version History */}
            <div className="bg-slate-50/50 rounded-2xl p-8 border border-slate-100 h-full">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Version History
              </h3>
              <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {notifications.length > 0 ? notifications.map((n) => {
                  const isRejected = n.event_type === 'STATUS_CHANGED_REJECTED' || n.event_type === 'STATUS_CHANGED_MORE_INFO_REQUESTED';
                  const isApproved = n.event_type === 'STATUS_CHANGED_APPROVED';
                  return (
                    <div key={n.id} className="relative pl-10">
                      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full z-10 border-4 border-white shadow-sm ${isApproved ? 'bg-green-500' : isRejected ? 'bg-red-500' : 'bg-slate-300'}`} />
                      <p className={`text-xs font-black uppercase tracking-tight ${isApproved ? 'text-green-600' : isRejected ? 'text-red-600' : 'text-slate-700'}`}>{getFriendlyEvent(n.event_type)}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                    </div>
                  );
                }) : (<p className="text-xs text-slate-300 italic ml-6">No history recorded.</p>)}
              </div>
              <button onClick={() => { localStorage.clear(); window.location.href='/login'; }} className="mt-12 w-full py-3 text-[10px] font-black text-slate-300 hover:text-red-500 uppercase tracking-widest border border-dashed border-slate-200 rounded-xl transition-colors">Sign out</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantFlow;
