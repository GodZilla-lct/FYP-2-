# Campus Connect v4.0 - API Testing Guide

## 🧪 Complete API Testing Reference

This guide provides curl commands and Postman examples for testing all API endpoints.

---

## 🔐 Authentication Endpoints

### 1. Register New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@uog.edu.pk",
    "password": "password123",
    "rollNumber": "2024-CS-999",
    "role": "STUDENT"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "user": { "id": 1, "name": "John Doe", ... }
}
```

---

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "director@uog.edu.pk",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

**Save the token for subsequent requests!**

---

### 3. Refresh Token
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

---

### 4. Forgot Password
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "director@uog.edu.pk"
  }'
```

---

### 5. Reset Password
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "RESET_TOKEN_FROM_EMAIL",
    "newPassword": "newpassword123"
  }'
```

---

## 📝 Proposal Endpoints

### 6. Create Proposal
```bash
curl -X POST http://localhost:5000/api/proposals \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Annual Tech Fest 2026" \
  -F "description=A 3-day technology festival" \
  -F "eventDate=2026-05-15" \
  -F "budgetRequested=50000" \
  -F "files=@/path/to/document.pdf"
```

---

### 7. Get All Proposals
```bash
curl -X GET http://localhost:5000/api/proposals \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 8. Get My Proposals
```bash
curl -X GET http://localhost:5000/api/proposals/my-proposals \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 9. Get Single Proposal
```bash
curl -X GET http://localhost:5000/api/proposals/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 10. Approve/Reject Proposal
```bash
# Approve
curl -X POST http://localhost:5000/api/proposals/next-status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "proposalId": 1,
    "action": "APPROVE"
  }'

# Reject (Soft)
curl -X POST http://localhost:5000/api/proposals/next-status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "proposalId": 1,
    "action": "REJECT",
    "rejectionReason": "Budget too high",
    "rejectionType": "SOFT"
  }'

# Reject (Hard)
curl -X POST http://localhost:5000/api/proposals/next-status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "proposalId": 1,
    "action": "REJECT",
    "rejectionReason": "Against university policy",
    "rejectionType": "HARD"
  }'
```

---

## 📝 Draft Endpoints

### 11. Create Draft
```bash
curl -X POST http://localhost:5000/api/proposals/drafts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Draft Proposal" \
  -F "description=Work in progress" \
  -F "eventDate=2026-06-01" \
  -F "budgetRequested=25000"
```

---

### 12. Get My Drafts
```bash
curl -X GET http://localhost:5000/api/proposals/drafts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 13. Publish Draft
```bash
curl -X POST http://localhost:5000/api/proposals/drafts/1/publish \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 14. Delete Draft
```bash
curl -X DELETE http://localhost:5000/api/proposals/drafts/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 💬 Comment Endpoints

### 15. Get Comments
```bash
curl -X GET http://localhost:5000/api/proposals/1/comments \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 16. Add Comment
```bash
curl -X POST http://localhost:5000/api/proposals/1/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "Great proposal! Looking forward to this event."
  }'
```

---

### 17. Update Comment
```bash
curl -X PUT http://localhost:5000/api/proposals/1/comments/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "Updated comment text"
  }'
```

---

### 18. Delete Comment
```bash
curl -X DELETE http://localhost:5000/api/proposals/1/comments/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔔 Notification Endpoints

### 19. Get Notifications
```bash
# All notifications
curl -X GET http://localhost:5000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"

# Unread only
curl -X GET "http://localhost:5000/api/notifications?unreadOnly=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 20. Mark Notification as Read
```bash
curl -X PUT http://localhost:5000/api/notifications/1/read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 21. Mark All as Read
```bash
curl -X PUT http://localhost:5000/api/notifications/mark-all-read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 22. Get/Update Notification Preferences
```bash
# Get preferences
curl -X GET http://localhost:5000/api/notifications/preferences \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update preferences
curl -X PUT http://localhost:5000/api/notifications/preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emailNotifications": true,
    "pushNotifications": false,
    "proposalUpdates": true,
    "comments": true
  }'
```

---

## 📊 Analytics Endpoints

### 23. Get Analytics Overview
```bash
curl -X GET http://localhost:5000/api/analytics/overview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 24. Get Proposal Analytics
```bash
curl -X GET "http://localhost:5000/api/analytics/proposals?startDate=2026-01-01&endDate=2026-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 25. Get Budget Analytics
```bash
curl -X GET http://localhost:5000/api/analytics/budget \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔍 Search Endpoints

### 26. Search Proposals
```bash
curl -X GET "http://localhost:5000/api/search/proposals?q=tech&status=APPROVED&societyId=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 27. Save Search Filter
```bash
curl -X POST http://localhost:5000/api/search/save-filter \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Approved Tech Events",
    "filters": {
      "status": "APPROVED",
      "keyword": "tech"
    }
  }'
```

---

### 28. Get Saved Filters
```bash
curl -X GET http://localhost:5000/api/search/saved-filters \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📅 Calendar Endpoints

### 29. Get Calendar Events
```bash
curl -X GET "http://localhost:5000/api/calendar/events?month=5&year=2026" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 30. Create Event
```bash
curl -X POST http://localhost:5000/api/calendar/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tech Fest 2026",
    "description": "Annual technology festival",
    "startDate": "2026-05-15T09:00:00",
    "endDate": "2026-05-17T18:00:00",
    "location": "Main Auditorium",
    "proposalId": 1
  }'
```

---

## 💰 Budget Endpoints

### 31. Get Budget Allocations
```bash
curl -X GET http://localhost:5000/api/budget/allocations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 32. Create Budget Allocation
```bash
curl -X POST http://localhost:5000/api/budget/allocations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "societyId": 1,
    "amount": 100000,
    "fiscalYear": "2026",
    "category": "EVENTS"
  }'
```

---

### 33. Get Society Budget
```bash
curl -X GET http://localhost:5000/api/budget/society/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 👤 User Profile Endpoints

### 34. Get User Profile
```bash
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 35. Update Profile
```bash
curl -X PUT http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated",
    "bio": "Computer Science student",
    "phone": "+92-300-1234567"
  }'
```

---

### 36. Upload Profile Picture
```bash
curl -X POST http://localhost:5000/api/users/profile/picture \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "profilePicture=@/path/to/image.jpg"
```

---

### 37. Get User Activity
```bash
curl -X GET http://localhost:5000/api/users/activity \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 👥 Society Endpoints

### 38. Get All Societies
```bash
curl -X GET http://localhost:5000/api/societies \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 39. Get Society by ID
```bash
curl -X GET http://localhost:5000/api/societies/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 40. Create Society (Director SSC only)
```bash
curl -X POST http://localhost:5000/api/societies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AI & Robotics Society",
    "description": "Exploring artificial intelligence"
  }'
```

---

## 🏥 Health & System Endpoints

### 41. Health Check
```bash
curl -X GET http://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "version": "4.0",
  "timestamp": "2026-04-03T...",
  "features": [...]
}
```

---

### 42. Get Dashboard Data
```bash
curl -X GET http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🧪 Postman Collection

### Import this JSON into Postman:

```json
{
  "info": {
    "name": "Campus Connect v4.0",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{token}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000/api"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

---

## 🔄 Testing Workflow

### Complete Test Scenario:

```bash
# 1. Register user
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@uog.edu.pk","password":"test123","rollNumber":"2024-TEST-001"}' \
  | jq -r '.token')

# 2. Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"director@uog.edu.pk","password":"password123"}' \
  | jq -r '.token')

# 3. Create draft
curl -X POST http://localhost:5000/api/proposals/drafts \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=Test Event" \
  -F "description=Test Description" \
  -F "eventDate=2026-06-01" \
  -F "budgetRequested=10000"

# 4. Get drafts
curl -X GET http://localhost:5000/api/proposals/drafts \
  -H "Authorization: Bearer $TOKEN"

# 5. Publish draft
curl -X POST http://localhost:5000/api/proposals/drafts/1/publish \
  -H "Authorization: Bearer $TOKEN"

# 6. Get notifications
curl -X GET http://localhost:5000/api/notifications \
  -H "Authorization: Bearer $TOKEN"

# 7. Add comment
curl -X POST http://localhost:5000/api/proposals/1/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comment":"Great proposal!"}'

# 8. Get analytics
curl -X GET http://localhost:5000/api/analytics/overview \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🧪 WebSocket Testing

### Using JavaScript in Browser Console:

```javascript
// Connect to WebSocket
const socket = io('http://localhost:5000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

// Listen for notifications
socket.on('notification', (data) => {
  console.log('New notification:', data);
});

// Listen for proposal updates
socket.on('proposalUpdate', (data) => {
  console.log('Proposal updated:', data);
});

// Join proposal room for comments
socket.emit('joinProposal', 1);

// Listen for new comments
socket.on('newComment', (data) => {
  console.log('New comment:', data);
});
```

---

## 📊 Load Testing

### Using Apache Bench:

```bash
# Test login endpoint
ab -n 100 -c 10 -p login.json -T application/json \
  http://localhost:5000/api/auth/login

# Test proposals endpoint
ab -n 100 -c 10 -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/proposals
```

### Using Artillery:

```yaml
# artillery.yml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Load test proposals"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "director@uog.edu.pk"
            password: "password123"
          capture:
            - json: "$.token"
              as: "token"
      - get:
          url: "/api/proposals"
          headers:
            Authorization: "Bearer {{ token }}"
```

Run: `artillery run artillery.yml`

---

## 🐛 Error Testing

### Test Rate Limiting:
```bash
# Send 100 requests rapidly
for i in {1..100}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}' &
done
```

**Expected**: After 5 requests, should return 429 Too Many Requests

---

### Test Validation:
```bash
# Invalid email
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email","password":"test"}'

# Expected: 400 Bad Request with validation error
```

---

### Test Authorization:
```bash
# No token
curl -X GET http://localhost:5000/api/proposals

# Expected: 401 Unauthorized

# Invalid token
curl -X GET http://localhost:5000/api/proposals \
  -H "Authorization: Bearer invalid_token"

# Expected: 401 Unauthorized
```

---

## 📈 Performance Testing

### Response Time Benchmarks:

| Endpoint | Target | Acceptable |
|----------|--------|------------|
| Login | < 100ms | < 200ms |
| Get Proposals | < 150ms | < 300ms |
| Create Proposal | < 200ms | < 400ms |
| Analytics | < 300ms | < 500ms |
| Search | < 200ms | < 400ms |

### Test Response Times:
```bash
# Using curl with timing
curl -w "@curl-format.txt" -o /dev/null -s \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/proposals
```

**curl-format.txt:**
```
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_starttransfer:  %{time_starttransfer}\n
time_total:  %{time_total}\n
```

---

## 🎯 Test Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: All endpoints
- **E2E Tests**: Critical user flows
- **Load Tests**: 100 concurrent users
- **Security Tests**: OWASP Top 10

---

## 📝 Test Results Template

```markdown
## Test Run: [Date]

### Environment:
- Node.js: v18.x
- MySQL: v8.0
- Redis: v6.2

### Results:
- Total Tests: 42
- Passed: 42
- Failed: 0
- Duration: 2m 15s

### Performance:
- Avg Response Time: 145ms
- Max Response Time: 380ms
- Requests/sec: 250

### Issues Found:
- None

### Status: ✅ PASS
```

---

## 🆘 Troubleshooting

### Issue: 401 Unauthorized
**Solution**: Check if token is valid and not expired

### Issue: 429 Too Many Requests
**Solution**: Wait for rate limit to reset (1 minute)

### Issue: 500 Internal Server Error
**Solution**: Check server logs for details

### Issue: WebSocket not connecting
**Solution**: Verify Socket.IO server is running and token is valid

---

## 📚 Additional Resources

- [API Documentation](docs/WORKFLOW_API_DOCUMENTATION.md)
- [V4 Features](docs/V4_FEATURES.md)
- [Installation Guide](INSTALLATION_GUIDE.md)

---

**🧪 Happy Testing!**
