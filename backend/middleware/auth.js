function authenticate(req, res, next) {
  // Allow login endpoint without auth
  if (req.path === '/auth/login') {
    return next();
  }

  // Get user from session/token (simplified for demo)
  // In production, you'd verify JWT tokens from Authorization header
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];
  const userEmail = req.headers['x-user-email'];

  if (!userId) {
    // For demo purposes, if no headers provided, assume admin for testing
    req.user = {
      id: 1,
      role: 'DIRECTOR_SSC',
      email: 'director.ssc@uog.edu.pk',
    };
  } else {
    req.user = {
      id: parseInt(userId),
      role: userRole,
      email: userEmail,
    };
  }
  
  next();
}

function authorize(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
