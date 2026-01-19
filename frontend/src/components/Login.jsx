import { useState } from 'react';
import './Login.css';
import { setCurrentUser } from '../utils/auth';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentUser(data.user);
        onLogin(data.user);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    if (role === 'admin') {
      setFormData({
        email: 'director.ssc@uog.edu.pk',
        password: 'password123'
      });
    } else {
      setFormData({
        email: 'bs-cs-001@uog.edu.pk',
        password: 'password123'
      });
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Campus Connect</h1>
          <p>University Management Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="demo-section">
          <h3>Demo Accounts</h3>
          <div className="demo-buttons">
            <button 
              type="button" 
              className="demo-btn admin-demo"
              onClick={() => handleDemoLogin('admin')}
            >
              Demo Admin Login
            </button>
            <button 
              type="button" 
              className="demo-btn president-demo"
              onClick={() => handleDemoLogin('president')}
            >
              Demo President Login
            </button>
          </div>
          <div className="demo-info">
            <p><strong>Admin:</strong> director.ssc@uog.edu.pk</p>
            <p><strong>President:</strong> bs-cs-001@uog.edu.pk</p>
            <p><strong>Password:</strong> password123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;