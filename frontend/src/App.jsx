import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MerchantFlow from './pages/MerchantFlow';
import ReviewerDashboard from './pages/ReviewerDashboard';
import SubmissionDetail from './pages/SubmissionDetail';
import { Toaster } from 'react-hot-toast';

const PrivateRoute = ({ children, role }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token) return <Navigate to="/login" />;
  if (role && userRole !== role) return <Navigate to="/" />;
  
  return children;
};

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-slate-50">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route 
            path="/merchant" 
            element={
              <PrivateRoute role="MERCHANT">
                <MerchantFlow />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/reviewer" 
            element={
              <PrivateRoute role="REVIEWER">
                <ReviewerDashboard />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/reviewer/submission/:id" 
            element={
              <PrivateRoute role="REVIEWER">
                <SubmissionDetail />
              </PrivateRoute>
            } 
          />

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
