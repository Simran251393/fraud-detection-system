import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [authFlow, setAuthFlow] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [showOtpHint, setShowOtpHint] = useState(null);

  const handleCheckEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post('/api/login/check', { email });
      
      setAuthFlow(response.data.auth_flow);
      setRiskData(response.data.risk_data);
      setAttemptId(response.data.attempt_id);

      if (response.data.auth_flow === 'passwordless') {
        // Automatically log in for low-risk users
        handlePasswordlessLogin(response.data.attempt_id);
      } else if (response.data.auth_flow === 'otp_verification') {
        setShowOtpHint(response.data.otp_code);
        setMessage({
          type: 'info',
          text: response.data.message
        });
      }

    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Login check failed';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordlessLogin = async (attId) => {
    try {
      const response = await axios.post('/api/login/passwordless', {
        email,
        attempt_id: attId || attemptId
      });

      setMessage({
        type: 'success',
        text: 'Login successful! Redirecting...'
      });

      setTimeout(() => {
        onLogin(response.data.user, response.data.token);
      }, 1000);

    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Login failed'
      });
    }
  };

  const handleOtpVerification = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/login/verify-otp', {
        email,
        otp_code: otpCode,
        attempt_id: attemptId
      });

      setMessage({
        type: 'success',
        text: 'OTP verified! Logging you in...'
      });

      setTimeout(() => {
        onLogin(response.data.user, response.data.token);
      }, 1000);

    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'OTP verification failed'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-icon">
            <i className="fas fa-lock"></i>
          </div>
          <h2>Welcome Back</h2>
          <p>Sign in to your account</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            <i className={`fas fa-${message.type === 'success' ? 'check-circle' : message.type === 'info' ? 'info-circle' : 'exclamation-circle'}`}></i>
            {message.text}
          </div>
        )}

        {riskData && (
          <div className={`alert alert-info`}>
            <i className="fas fa-shield-halved"></i>
            <div>
              <strong>Security Check:</strong>
              <span className={`risk-badge risk-${riskData.risk_level.toLowerCase()}`} style={{ marginLeft: '10px' }}>
                {riskData.risk_level} RISK
              </span>
              <div style={{ fontSize: '0.85rem', marginTop: '5px' }}>
                Score: {riskData.risk_score}/100 | {riskData.location.city}, {riskData.location.country}
              </div>
            </div>
          </div>
        )}

        {!authFlow ? (
          <form onSubmit={handleCheckEmail}>
            <div className="form-group">
              <label htmlFor="email">
                <i className="fas fa-envelope"></i> Email Address
              </label>
              <input
                type="email"
                id="email"
                className="form-control"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner"></span> Checking...
                </>
              ) : (
                <>
                  <i className="fas fa-arrow-right"></i> Continue
                </>
              )}
            </button>
          </form>
        ) : authFlow === 'otp_verification' ? (
          <form onSubmit={handleOtpVerification}>
            <div className="form-group">
              <label htmlFor="otp">
                <i className="fas fa-key"></i> Enter OTP Code
              </label>
              <input
                type="text"
                id="otp"
                className="form-control"
                placeholder="Enter 6-digit OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength="6"
                required
              />
              {showOtpHint && (
                <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                  <i className="fas fa-lightbulb"></i> Demo OTP: <strong>{showOtpHint}</strong>
                </small>
              )}
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner"></span> Verifying...
                </>
              ) : (
                <>
                  <i className="fas fa-check"></i> Verify OTP
                </>
              )}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setAuthFlow(null);
                setRiskData(null);
                setOtpCode('');
                setMessage({ type: '', text: '' });
              }}
              style={{ marginTop: '10px', width: '100%' }}
            >
              <i className="fas fa-arrow-left"></i> Back
            </button>
          </form>
        ) : null}

        <div className="auth-footer">
          Don't have an account? <a href="/register">Sign Up</a>
        </div>
      </div>
    </div>
  );
};

export default Login;