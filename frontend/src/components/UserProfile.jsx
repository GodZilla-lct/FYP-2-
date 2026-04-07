import { useState, useEffect } from 'react';
import { getAuthHeaders } from '../utils/auth';
import './UserProfile.css';

const UserProfile = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // FIXED: Use /api/users/profile instead of /api/users/${user.id}
      const response = await fetch('/api/users/profile', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setFormData({
          name: data.user.name || '',
          phone: data.user.phone || ''
        });
      } else {
        console.error('Failed to fetch profile');
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      // Only send name and phone (no bio)
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || 'Profile updated successfully');
        setEditing(false);
        fetchProfile();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        alert('Password changed successfully');
        setShowChangePassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to change password');
      }
    } catch (err) {
      console.error('Failed to change password:', err);
    }
  };

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="profile-error">Profile not found</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          {profile.profile_picture ? (
            <img src={profile.profile_picture} alt={profile.name} />
          ) : (
            <div className="avatar-placeholder">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="profile-info">
          <h1>{profile.name}</h1>
          <p className="profile-role">{profile.role}</p>
          <p className="profile-email">{profile.email}</p>
        </div>
      </div>

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

      <div className="profile-details">
        <div className="details-header">
          <h3>Profile Details</h3>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="btn btn-outline">
              Edit Profile
            </button>
          ) : (
            <div className="edit-actions">
              <button onClick={() => setEditing(false)} className="btn btn-secondary">
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
            {/* Email - DISABLED (Cannot be changed) */}
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="readonly-field"
                title="Email cannot be changed"
              />
              <small className="field-note">Email cannot be changed</small>
            </div>
            
            {/* Role - READ-ONLY Badge (Cannot be changed) */}
            <div className="form-group">
              <label>Role</label>
              <div className="role-badge-readonly">
                <span className="role-badge">{profile.role}</span>
              </div>
              <small className="field-note">Role is assigned by administrators</small>
            </div>
            
            {/* Name - EDITABLE */}
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter your full name"
                required
              />
            </div>
            
            {/* Phone - EDITABLE (but doesn't save in v3 schema) */}
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+92 300 1234567"
              />
              <small className="field-note">Optional contact number</small>
            </div>
          </div>
        ) : (
          <div className="view-details">
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{profile.email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Roll Number:</span>
              <span className="detail-value">{profile.roll_number || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Phone:</span>
              <span className="detail-value">{profile.phone || 'Not provided'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Member Since:</span>
              <span className="detail-value">{new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </div>

      <div className="profile-societies">
        <h3>Society Roles</h3>
        {!profile.societyRoles || profile.societyRoles.length === 0 ? (
          <p>Not assigned to any society</p>
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

      <div className="profile-security">
        <h3>Security</h3>
        <button onClick={() => setShowChangePassword(!showChangePassword)} className="btn btn-outline">
          Change Password
        </button>

        {showChangePassword && (
          <div className="change-password-form">
            <input
              type="password"
              placeholder="Current Password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
            />
            <input
              type="password"
              placeholder="New Password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
            />
            <button onClick={handleChangePassword} className="btn btn-primary">
              Update Password
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
