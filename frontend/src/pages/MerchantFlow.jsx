import React, { useState, useEffect } from 'react';
import { getMyKYC, updateMyKYC, submitKYC, uploadDoc } from '../api/api';
import { CheckCircle2, Circle, Upload, Send, FileText, Briefcase, User as UserIcon, Loader2 } from 'lucide-react';

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

  useEffect(() => {
    fetchKYC();
  }, []);

  const fetchKYC = async () => {
    try {
      const { data } = await getMyKYC();
      setKycData(data);
      if (data.status !== 'draft' && data.status !== 'more_info_requested') {
        setStep(4); // Show status page
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
      setStep(step + 1);
    } catch (err) {
      alert('Error updating details');
    }
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', type);

    setUploading(true);
    try {
      await uploadDoc(formData);
      fetchKYC();
    } catch (err) {
      alert(err.response?.data?.error || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitKYC();
      fetchKYC();
      setStep(4);
    } catch (err) {
      alert(err.response?.data?.error || 'Error submitting KYC');
    } finally {
      setSubmitting(false);
    }
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
    <div className="max-w-4xl mx-auto py-12 px-4">
      {/* Stepper */}
      <div className="flex justify-between mb-12 relative">
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
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <UserIcon className="w-8 h-8 text-primary-600" />
              <h2 className="text-2xl font-bold text-slate-800">Personal Details</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  value={kycData.full_name}
                  onChange={(e) => setKycData({...kycData, full_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  value={kycData.email}
                  onChange={(e) => setKycData({...kycData, email: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-600 mb-2">Phone Number</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  value={kycData.phone_number}
                  onChange={(e) => setKycData({...kycData, phone_number: e.target.value})}
                />
              </div>
            </div>
            <button type="submit" className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg">
              Next: Business Details
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Briefcase className="w-8 h-8 text-primary-600" />
              <h2 className="text-2xl font-bold text-slate-800">Business Details</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-600 mb-2">Business Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  value={kycData.business_name}
                  onChange={(e) => setKycData({...kycData, business_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Business Type</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  value={kycData.business_type}
                  onChange={(e) => setKycData({...kycData, business_type: e.target.value})}
                >
                  <option value="">Select Type</option>
                  <option value="Freelancer">Freelancer</option>
                  <option value="LLP">LLP</option>
                  <option value="Private Limited">Private Limited</option>
                  <option value="Proprietorship">Proprietorship</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Expected Monthly Volume (USD)</label>
                <input
                  type="number"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  value={kycData.expected_monthly_volume}
                  onChange={(e) => setKycData({...kycData, expected_monthly_volume: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => setStep(1)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-xl">
                Back
              </button>
              <button type="submit" className="flex-[2] py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg">
                Next: Documents
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-8 h-8 text-primary-600" />
              <h2 className="text-2xl font-bold text-slate-800">Identity Documents</h2>
            </div>
            
            <div className="space-y-4">
              {['PAN', 'AADHAAR', 'BANK_STATEMENT'].map((type) => {
                const doc = kycData.documents.find(d => d.document_type === type);
                return (
                  <div key={type} className="flex items-center justify-between p-6 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                    <div>
                      <p className="font-bold text-slate-800">{type.replace('_', ' ')}</p>
                      <p className="text-sm text-slate-500">{doc ? '✅ Uploaded' : 'Required (PDF, JPG, PNG)'}</p>
                    </div>
                    <label className="cursor-pointer bg-white px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all">
                      {doc ? 'Change' : 'Upload'}
                      <input type="file" className="hidden" onChange={(e) => handleFileChange(e, type)} />
                    </label>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep(2)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-xl">
                Back
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={submitting || kycData.documents.length < 3}
                className="flex-[2] py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="animate-spin" /> : <Send className="w-5 h-5" />}
                Submit for Review
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-8">
            {kycData.status === 'submitted' || kycData.status === 'under_review' ? (
              <>
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6 text-primary-600">
                  <Loader2 className="w-10 h-10 animate-spin" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-4">KYC Under Review</h2>
                <p className="text-slate-500 max-w-md mx-auto">
                  Your documents are being verified by our compliance team. This usually takes less than 24 hours.
                </p>
              </>
            ) : kycData.status === 'approved' ? (
              <>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-4">Account Verified!</h2>
                <p className="text-slate-500 max-w-md mx-auto">
                  Congratulations! Your KYC is approved. You can now start collecting international payments.
                </p>
              </>
            ) : kycData.status === 'more_info_requested' ? (
              <>
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-4">More Info Needed</h2>
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6 text-amber-800 text-sm">
                  <strong>Reason:</strong> {kycData.rejection_reason || 'Please update your documents as requested.'}
                </div>
                <button onClick={() => setStep(1)} className="px-8 py-3 bg-amber-600 text-white font-bold rounded-xl">
                  Update Details
                </button>
              </>
            ) : (
              <div className="text-red-500">Something went wrong.</div>
            )}
            
            <button 
              onClick={() => { localStorage.clear(); window.location.href='/login'; }} 
              className="mt-12 text-slate-400 text-sm hover:text-slate-600 underline"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantFlow;
