import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchAttempts();
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchAttempts();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttempts = async () => {
    try {
      const response = await axios.get('/api/admin/attempts');
      setAttempts(response.data.attempts);
    } catch (error) {
      console.error('Error fetching attempts:', error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <div className="loading-spinner" style={{ width: '50px', height: '50px', margin: '0 auto' }}></div>
        <p style={{ marginTop: '20px', color: '#666' }}>Loading analytics...</p>
      </div>
    );
  }

  const riskChartData = {
    labels: ['Low Risk', 'Medium Risk', 'High Risk'],
    datasets: [
      {
        data: [
          stats?.risk_distribution.LOW || 0,
          stats?.risk_distribution.MEDIUM || 0,
          stats?.risk_distribution.HIGH || 0
        ],
        backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  const successChartData = {
    labels: ['Successful', 'Failed'],
    datasets: [
      {
        label: 'Login Attempts',
        data: [
          attempts.filter(a => a.success).length,
          attempts.filter(a => !a.success).length
        ],
        backgroundColor: ['#667eea', '#f87171']
      }
    ]
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>
          <i className="fas fa-chart-line"></i> Analytics Dashboard
        </h1>
        <p style={{ color: '#666', marginTop: '10px' }}>
          Real-time fraud detection analytics and system overview
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">
              <i className="fas fa-users"></i>
            </div>
          </div>
          <div className="stat-content">
            <h3>{stats?.total_users || 0}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">
              <i className="fas fa-clipboard-list"></i>
            </div>
          </div>
          <div className="stat-content">
            <h3>{stats?.total_attempts || 0}</h3>
            <p>Total Attempts</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">
              <i className="fas fa-ban"></i>
            </div>
          </div>
          <div className="stat-content">
            <h3>{stats?.blocked_users || 0}</h3>
            <p>Blocked Users</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
          </div>
          <div className="stat-content">
            <h3>{stats?.risk_distribution.HIGH || 0}</h3>
            <p>High Risk Attempts</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', marginBottom: '30px' }}>
        <div className="chart-container">
          <h3><i className="fas fa-chart-pie"></i> Risk Level Distribution</h3>
          <div style={{ maxWidth: '300px', margin: '20px auto' }}>
            <Doughnut data={riskChartData} options={{ plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>

        <div className="chart-container">
          <h3><i className="fas fa-chart-bar"></i> Login Success Rate</h3>
          <div style={{ maxWidth: '300px', margin: '20px auto' }}>
            <Bar data={successChartData} options={{ plugins: { legend: { display: false } } }} />
          </div>
        </div>
      </div>

      <div className="attempts-table">
        <h3><i className="fas fa-history"></i> Recent Login Attempts</h3>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Risk Level</th>
                <th>Risk Score</th>
                <th>IP Address</th>
                <th>Location</th>
                <th>Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {attempts.slice(0, 15).map((attempt) => {
                let location = 'Unknown';
                try {
                  const loc = JSON.parse(attempt.location);
                  location = `${loc.city}, ${loc.country}`;
                } catch (e) {}

                return (
                  <tr key={attempt.id}>
                    <td>{attempt.email}</td>
                    <td>
                      <span className={`risk-badge risk-${attempt.risk_level.toLowerCase()}`}>
                        {attempt.risk_level}
                      </span>
                    </td>
                    <td>{attempt.risk_score.toFixed(1)}</td>
                    <td>{attempt.ip_address}</td>
                    <td>{location}</td>
                    <td>
                      {attempt.success ? (
                        <span style={{ color: '#28a745' }}>
                          <i className="fas fa-check-circle"></i> Success
                        </span>
                      ) : (
                        <span style={{ color: '#dc3545' }}>
                          <i className="fas fa-times-circle"></i> Failed
                        </span>
                      )}
                    </td>
                    <td>{new Date(attempt.timestamp).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;