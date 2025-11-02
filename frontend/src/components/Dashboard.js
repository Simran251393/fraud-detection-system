import React from 'react';

const Dashboard = ({ user }) => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>
          <i className="fas fa-home"></i> Welcome, {user?.name}!
        </h1>
        <p style={{ color: '#666', marginTop: '10px' }}>
          You're securely logged in with our next-generation authentication system
        </p>
        <div className="user-info">
          <div>
            <i className="fas fa-envelope"></i> {user?.email}
          </div>
          {user?.phone && (
            <div>
              <i className="fas fa-phone"></i> {user?.phone}
            </div>
          )}
          <div>
            <i className="fas fa-calendar"></i> Member since: {new Date(user?.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">
              <i className="fas fa-shield-check"></i>
            </div>
          </div>
          <div className="stat-content">
            <h3>Secure</h3>
            <p>Your account is protected with advanced fraud detection</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">
              <i className="fas fa-lock"></i>
            </div>
          </div>
          <div className="stat-content">
            <h3>Passwordless</h3>
            <p>Enjoy seamless authentication without passwords</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">
              <i className="fas fa-chart-line"></i>
            </div>
          </div>
          <div className="stat-content">
            <h3>Real-time</h3>
            <p>Dynamic risk scoring on every login attempt</p>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <h3><i className="fas fa-info-circle"></i> About This System</h3>
        <div style={{ lineHeight: '1.8' }}>
          <p style={{ marginBottom: '15px' }}>
            <strong>Our Dynamic Risk Scoring Engine</strong> analyzes multiple factors in real-time to ensure your security:
          </p>
          <ul style={{ paddingLeft: '20px', color: '#666' }}>
            <li><strong>Device Intelligence:</strong> Recognizes your trusted devices</li>
            <li><strong>Location Tracking:</strong> Monitors geographic login patterns</li>
            <li><strong>Behavioral Analysis:</strong> Detects unusual login frequencies</li>
            <li><strong>Adaptive Authentication:</strong> Adjusts security based on risk level</li>
          </ul>
          <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <strong>🔒 Security Levels:</strong>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
              <span className="risk-badge risk-low">LOW RISK - Passwordless Login</span>
              <span className="risk-badge risk-medium">MEDIUM RISK - OTP Required</span>
              <span className="risk-badge risk-high">HIGH RISK - Access Blocked</span>
            </div>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <h3><i className="fas fa-users"></i> Team Mavericks</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
          <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <strong>Hasti Shah</strong>
            <p style={{ color: '#666', fontSize: '0.9rem', margin: '5px 0 0 0' }}>Team Leader</p>
          </div>
          <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <strong>Dipak Raval</strong>
            <p style={{ color: '#666', fontSize: '0.9rem', margin: '5px 0 0 0' }}>Team Member</p>
          </div>
          <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <strong>Jenil Sanchaniya</strong>
            <p style={{ color: '#666', fontSize: '0.9rem', margin: '5px 0 0 0' }}>Team Member</p>
          </div>
          <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <strong>Simran Patra</strong>
            <p style={{ color: '#666', fontSize: '0.9rem', margin: '5px 0 0 0' }}>Team Member</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;