import React, { useState } from 'react';
import axios from 'axios';

const Register = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [riskData, setRiskData] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post('/api/register', formData);
      
      setRiskData(response.data.risk_data);
      setMessage({
        type: 'success',
        text: 'Registration successful! Logging you in...'
      });

      // Login user after successful registration
      setTimeout(() => {
        onLogin(response.data.user, response.data.token);
      }, 1500);

    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Registration failed';
      setMessage({ type: 'error', text: errorMsg });
      
      if (error.response?.data?.risk_level === 'HIGH') {
        setMessage({
          type: 'error',
          text: 'Registration blocked due to suspicious activity. Please contact support.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-icon">
            <i className="fas fa-user-plus"></i>
          </div>
          <h2>Create Account</h2>
          <p>Join our secure authentication platform</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            <i className={`fas fa-${message.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
            {message.text}
          </div>
        )}

        {riskData && (
          <div className={`alert alert-info`}>
            <i className="fas fa-info-circle"></i>
            <div>
              <strong>Risk Assessment:</strong>
              <span className={`risk-badge risk-${riskData.risk_level.toLowerCase()}`} style={{ marginLeft: '10px' }}>
                {riskData.risk_level}
              </span>
              <div style={{ fontSize: '0.85rem', marginTop: '5px' }}>
                Score: {riskData.risk_score}/100 | Location: {riskData.location.city}, {riskData.location.country}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">
              <i className="fas fa-user"></i> Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-control"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              <i className="fas fa-envelope"></i> Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-control"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              <i className="fas fa-phone"></i> Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="form-control"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span className="loading-spinner"></span> Processing...
              </>
            ) : (
              <>
                <i className="fas fa-user-plus"></i> Create Account
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <a href="/login">Sign In</a>
        </div>
      </div>
    </div>
  );
};

export default Register;