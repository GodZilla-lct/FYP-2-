import './Login.css';

/**
 * Legacy route placeholder: password reset is handled entirely from
 * Login → Forgot password (3-step OTP flow). Old JWT email links are obsolete.
 */
const ResetPassword = () => (
  <div className="login-container">
    <div className="login-card">
      <div className="login-header">
        <h1>Password reset</h1>
        <p>
          Reset your password from the login screen using <strong>Forgot password</strong>.
          You will receive a 6-digit code by email (valid for 10 minutes).
        </p>
      </div>
      <p style={{ color: '#6c757d', fontSize: '0.95rem' }}>
        Email links are no longer used for security and compatibility with campus networks.
      </p>
    </div>
  </div>
);

export default ResetPassword;
