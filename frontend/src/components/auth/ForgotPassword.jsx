import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const STEPS = { EMAIL: 1, OTP: 2, PASSWORD: 3 };

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'If an account exists, a code has been sent.');
        setStep(STEPS.OTP);
        setOtp('');
      } else {
        setError(data.message || data.error || 'Request failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpAndContinue = (e) => {
    e.preventDefault();
    resetMessages();
    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setStep(STEPS.PASSWORD);
  };

  const validatePasswords = () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setError('Password must include uppercase, lowercase, and a number.');
      return false;
    }
    return true;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    resetMessages();
    if (!validatePasswords()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp: otp.trim(),
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Password updated. You can sign in now.');
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      } else {
        setError(data.message || data.error || 'Reset failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goBackStep = () => {
    resetMessages();
    if (step === STEPS.OTP) {
      setStep(STEPS.EMAIL);
    } else if (step === STEPS.PASSWORD) {
      setStep(STEPS.OTP);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Reset password</h1>
          {step === STEPS.EMAIL && (
            <p>Step 1 of 3 — enter your account email</p>
          )}
          {step === STEPS.OTP && (
            <p>Step 2 of 3 — enter the 6-digit code from your email</p>
          )}
          {step === STEPS.PASSWORD && (
            <p>Step 3 of 3 — choose a new password</p>
          )}
        </div>

        {step === STEPS.EMAIL && (
          <form onSubmit={handleSendCode} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="your.email@uog.edu.pk"
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Sending…' : 'Send code'}
            </button>
          </form>
        )}

        {step === STEPS.OTP && (
          <form onSubmit={handleVerifyOtpAndContinue} className="login-form">
            <div className="form-group">
              <label htmlFor="otp">6-digit code</label>
              <input
                type="text"
                id="otp"
                name="otp"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                autoComplete="one-time-code"
                placeholder="000000"
                aria-describedby="otp-hint"
              />
              <p id="otp-hint" className="muted-hint" style={{ marginTop: '8px', fontSize: '0.85rem', color: '#6c757d' }}>
                Code expires in 10 minutes.
              </p>
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="login-btn">
              Continue
            </button>
            <button type="button" className="demo-btn" onClick={goBackStep}>
              ← Change email
            </button>
          </form>
        )}

        {step === STEPS.PASSWORD && (
          <form onSubmit={handleResetPassword} className="login-form">
            <div className="form-group">
              <label htmlFor="newPassword">New password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Min 8 chars, upper, lower, number"
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Re-enter password"
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Saving…' : 'Save new password'}
            </button>
            <button type="button" className="demo-btn" onClick={goBackStep}>
              ← Back to code
            </button>
          </form>
        )}

        <div className="demo-section">
          <button type="button" className="demo-btn" onClick={() => navigate('/login')}>
            ← Back to login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
