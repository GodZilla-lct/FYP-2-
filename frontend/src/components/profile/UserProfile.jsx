import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import './UserProfile.css';

/**
 * MODULE 1: THE SECURE PROFILE SYSTEM - FRONTEND
 * 
 * SECURITY FEATURES:
 * - Email is READ-ONLY (disabled input)
 * - Roll Number is READ-ONLY (disabled input)
 * - Only Name is editable
 * - Bio field completely removed
 * - Avatar upload with preview
 * - Secure password change with current password verification
 */

const UserProfile = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  
  // Form data - name, bio, phone are editable
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    phone: ''
  });
  
  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Password change state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/profile');
      const data = await response.json();
      setProfile(data.user);
      setFormData({
        name: data.user.name || '',
        bio: data.user.bio || '',
        phone: data.user.phone || ''
      });
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      alert('Failed to load profile. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      // Validate name
      if (!formData.name || formData.name.trim() === '') {
        alert('Name cannot be empty');
        return;
      }

      const response = await apiFetch('/profile/update', {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name,
          bio: formData.bio,
          phone: formData.phone
        })
      });

      const data = await response.json();

      alert(data.message || 'Profile updated successfully');
      setEditing(false);
      fetchProfile();
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert(err.message || 'Failed to update profile. Please try again.');
    }
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, and GIF images are allowed.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setAvatarFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      alert('Please select an image first');
      return;
    }

    try {
      setUploadingAvatar(true);

      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const token = localStorage.getItem('campus_connect_token');
      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload avatar');
      }

      const data = await response.json();
      alert(data.message || 'Profile picture uploaded successfully');
      
      // Reset avatar state
      setAvatarFile(null);
      setAvatarPreview(null);
      
      // Refresh profile
      fetchProfile();
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      alert(err.message || 'Failed to upload profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async () => {
    // Reset error
    setPasswordError('');

    // Validate inputs
    if (!passwordData.currentPassword) {
      setPasswordError('Current password is required');
      return;
    }

    if (!passwordData.newPassword) {
      setPasswordError('New password is required');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    // CRITICAL: Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }

    // Prevent using same password
    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    try {
      // Use native fetch to avoid auto-logout on 401 (wrong password)
      const token = localStorage.getItem('campus_connect_token');
      const response = await fetch('/api/profile/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle error response
        setPasswordError(data.message || 'Failed to change password');
        return;
      }

      alert(data.message || 'Password changed successfully');
      setShowChangePassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordError('');
    } catch (err) {
      console.error('Failed to change password:', err);
      setPasswordError('Network error. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container">
        <div className="profile-error">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* AVATAR SECTION */}
      <div className="profile-header">
        <div className="profile-avatar-section">
          <div className="profile-avatar">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Preview" />
            ) : profile.profile_picture ? (
              <img src={profile.profile_picture} alt={profile.name} />
            ) : (
              <div className="avatar-placeholder">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="avatar-upload-controls">
            <input
              type="file"
              id="avatar-input"
              accept="image/jpeg,image/jpg,image/png,image/gif"
              onChange={handleAvatarSelect}
              style={{ display: 'none' }}
            />
            <label htmlFor="avatar-input" className="btn btn-outline">
              📷 Change Picture
            </label>
            
            {avatarFile && (
              <button 
                onClick={handleAvatarUpload} 
                className="btn btn-primary"
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? 'Uploading...' : '✓ Upload'}
              </button>
            )}
            
            {avatarFile && (
              <button 
                onClick={() => {
                  setAvatarFile(null);
                  setAvatarPreview(null);
                }} 
                className="btn btn-secondary"
              >
                ✕ Cancel
              </button>
            )}
          </div>
          
          <p className="avatar-note">Max size: 5MB. Formats: JPEG, PNG, GIF</p>
        </div>
        
        <div className="profile-info">
          <h1>{profile.name}</h1>
          <p className="profile-role">{profile.role}</p>
          <p className="profile-email">{profile.email}</p>
        </div>
      </div>

      {/* STATS SECTION */}
      <div className="profile-stats">
        <div className="stat-item">
          <div className="stat-value">{profile.stats?.totalProposals || 0}</div>
          <div className="stat-label">Proposals Created</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{profile.stats?.totalApprovals || 0}</div>
          <div className="stat-label">Approvals Given</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{profile.societyRoles?.length || 0}</div>
          <div className="stat-label">Society Roles</div>
        </div>
      </div>

      {/* PROFILE DETAILS SECTION */}
      <div className="profile-details">
        <div className="details-header">
          <h3>Profile Details</h3>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="btn btn-outline">
              ✏️ Edit Profile
            </button>
          ) : (
            <div className="edit-actions">
              <button onClick={() => {
                setEditing(false);
                setFormData({ name: profile.name, bio: profile.bio || '', phone: profile.phone || '' });
              }} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleUpdate} className="btn btn-primary">
                Save Changes
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="edit-form">
            {/* Name - EDITABLE */}
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter your full name"
                required
                className="editable-field"
              />
              <small className="field-note">You can update your display name</small>
            </div>

            {/* Bio - EDITABLE */}
            <div className="form-group">
              <label>Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Tell us a little about yourself (optional)"
                rows="3"
                maxLength={1000}
                className="editable-field"
              />
              <small className="field-note">{formData.bio.length}/1000 characters</small>
            </div>

            {/* Phone - EDITABLE */}
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="e.g. +92 300 1234567 (optional)"
                maxLength={20}
                className="editable-field"
              />
            </div>
            
            {/* Email - READ-ONLY (LOCKED) */}
            <div className="form-group">
              <label>Email 🔒</label>
              <input
                type="email"
                value={profile.email}
                disabled
                readOnly
                className="readonly-field"
                title="Email cannot be changed"
              />
              <small className="field-note locked-note">🔒 Email cannot be changed for security reasons</small>
            </div>
            
            {/* Roll Number - READ-ONLY, only for students */}
            {profile.role === 'STUDENT' && profile.roll_number && (
              <div className="form-group">
                <label>Roll Number 🔒</label>
                <input
                  type="text"
                  value={profile.roll_number}
                  disabled
                  readOnly
                  className="readonly-field"
                  title="Roll number cannot be changed"
                />
                <small className="field-note locked-note">🔒 Roll number is assigned by administration</small>
              </div>
            )}
            
            {/* Role - READ-ONLY Badge */}
            <div className="form-group">
              <label>Role 🔒</label>
              <div className="role-badge-readonly">
                <span className="role-badge">{profile.role}</span>
              </div>
              <small className="field-note locked-note">🔒 Role is assigned by administrators</small>
            </div>
          </div>
        ) : (
          <div className="view-details">
            <div className="detail-row">
              <span className="detail-label">Name:</span>
              <span className="detail-value">{profile.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{profile.email}</span>
            </div>
            {profile.role === 'STUDENT' && profile.roll_number && (
              <div className="detail-row">
                <span className="detail-label">Roll Number:</span>
                <span className="detail-value">{profile.roll_number}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">Role:</span>
              <span className="detail-value">
                <span className="role-badge">{profile.role}</span>
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Member Since:</span>
              <span className="detail-value">{new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
            {profile.phone && (
              <div className="detail-row">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">{profile.phone}</span>
              </div>
            )}
            {profile.bio && (
              <div className="detail-row">
                <span className="detail-label">Bio:</span>
                <span className="detail-value">{profile.bio}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SOCIETY ROLES SECTION */}
      <div className="profile-societies">
        <h3>Society Roles</h3>
        {!profile.societyRoles || profile.societyRoles.length === 0 ? (
          <p className="no-societies">Not assigned to any society</p>
        ) : (
          <div className="societies-grid">
            {profile.societyRoles.map((role, index) => (
              <div key={index} className="society-role-card">
                <h4>{role.society_name}</h4>
                <p className="role-name">{role.role_name}</p>
                {role.is_core_leader && <span className="core-badge">Core Leader</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECURITY SECTION - PASSWORD CHANGE */}
      <div className="profile-security">
        <div className="security-header">
          <h3>🔐 Security</h3>
          <p className="security-subtitle">Manage your account security settings</p>
        </div>
        
        {!showChangePassword ? (
          <button 
            onClick={() => setShowChangePassword(true)} 
            className="btn btn-outline"
          >
            🔑 Change Password
          </button>
        ) : (
          <div className="change-password-card">
            <div className="password-card-header">
              <h4>Change Password</h4>
              <button 
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordError('');
                }} 
                className="btn-close"
              >
                ✕
              </button>
            </div>
            
            <div className="change-password-form">
              {passwordError && (
                <div className="error-alert">
                  ⚠️ {passwordError}
                </div>
              )}
              
              <div className="form-group">
                <label>Current Password *</label>
                <input
                  type="password"
                  placeholder="Enter your current password"
                  value={passwordData.currentPassword}
                  onChange={(e) => {
                    setPasswordData({...passwordData, currentPassword: e.target.value});
                    setPasswordError('');
                  }}
                  className="password-input"
                />
              </div>
              
              <div className="form-group">
                <label>New Password *</label>
                <input
                  type="password"
                  placeholder="Enter new password (min 6 characters)"
                  value={passwordData.newPassword}
                  onChange={(e) => {
                    setPasswordData({...passwordData, newPassword: e.target.value});
                    setPasswordError('');
                  }}
                  className="password-input"
                />
              </div>
              
              <div className="form-group">
                <label>Confirm New Password *</label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => {
                    setPasswordData({...passwordData, confirmPassword: e.target.value});
                    setPasswordError('');
                  }}
                  className="password-input"
                />
              </div>
              
              <div className="password-requirements">
                <p><strong>Password Requirements:</strong></p>
                <ul>
                  <li className={passwordData.newPassword.length >= 6 ? 'valid' : ''}>
                    {passwordData.newPassword.length >= 6 ? '✓' : '○'} At least 6 characters
                  </li>
                  <li className={passwordData.newPassword && passwordData.newPassword === passwordData.confirmPassword ? 'valid' : ''}>
                    {passwordData.newPassword && passwordData.newPassword === passwordData.confirmPassword ? '✓' : '○'} Passwords match
                  </li>
                  <li className={passwordData.currentPassword && passwordData.newPassword && passwordData.currentPassword !== passwordData.newPassword ? 'valid' : ''}>
                    {passwordData.currentPassword && passwordData.newPassword && passwordData.currentPassword !== passwordData.newPassword ? '✓' : '○'} Different from current password
                  </li>
                </ul>
              </div>
              
              <button 
                onClick={handleChangePassword} 
                className="btn btn-primary btn-full"
                disabled={
                  !passwordData.currentPassword || 
                  !passwordData.newPassword || 
                  !passwordData.confirmPassword ||
                  passwordData.newPassword !== passwordData.confirmPassword ||
                  passwordData.newPassword.length < 6
                }
              >
                Update Password
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
