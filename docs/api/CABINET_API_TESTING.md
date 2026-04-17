# Cabinet API Testing Guide

## Quick Reference for Testing Society Cabinet Endpoints

---

## Prerequisites

1. **Backend server running** on `http://localhost:5001`
2. **Valid JWT token** from login
3. **User with society leader or coordinator role**

---

## Get JWT Token

```bash
# Login to get token
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "president1@uog.edu.pk",
    "password": "password123"
  }'

# Response will include:
# {
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": { ... }
# }

# Copy the token value and use it in subsequent requests
```

---

## API Endpoints

### 1. Add Cabinet Member

```bash
curl -X POST http://localhost:5001/api/cabinet/add \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "society_id": 1,
    "student_name": "Ahmed Hassan",
    "roll_number": "2021-CS-123",
    "custom_role_title": "Graphics Head",
    "academic_year": "2023-2024"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Cabinet member added successfully",
  "data": {
    "id": 1,
    "society_id": 1,
    "student_name": "Ahmed Hassan",
    "roll_number": "2021-CS-123",
    "custom_role_title": "Graphics Head",
    "academic_year": "2023-2024",
    "added_by": 5
  }
}
```

---

### 2. Get All Cabinet Members for a Society

```bash
# Get all members
curl -X GET http://localhost:5001/api/cabinet/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

# Get members filtered by academic year
curl -X GET "http://localhost:5001/api/cabinet/1?academic_year=2023-2024" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "society": {
      "id": 1,
      "name": "Drama Society"
    },
    "members": [
      {
        "id": 1,
        "society_id": 1,
        "student_name": "Ahmed Hassan",
        "roll_number": "2021-CS-123",
        "custom_role_title": "Graphics Head",
        "academic_year": "2023-2024",
        "added_by": 5,
        "created_at": "2024-04-17T10:30:00.000Z",
        "added_by_name": "John Doe",
        "added_by_email": "john@uog.edu.pk"
      }
    ],
    "count": 1,
    "filtered_by_year": null
  }
}
```

---

### 3. Get Single Cabinet Member

```bash
curl -X GET http://localhost:5001/api/cabinet/member/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "society_id": 1,
    "student_name": "Ahmed Hassan",
    "roll_number": "2021-CS-123",
    "custom_role_title": "Graphics Head",
    "academic_year": "2023-2024",
    "added_by": 5,
    "created_at": "2024-04-17T10:30:00.000Z",
    "added_by_name": "John Doe",
    "added_by_email": "john@uog.edu.pk",
    "society_name": "Drama Society"
  }
}
```

---

### 4. Update Cabinet Member

```bash
# Update one or more fields
curl -X PUT http://localhost:5001/api/cabinet/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "custom_role_title": "Senior Graphics Head",
    "academic_year": "2024-2025"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Cabinet member updated successfully",
  "data": {
    "id": 1,
    "society_id": 1,
    "student_name": "Ahmed Hassan",
    "roll_number": "2021-CS-123",
    "custom_role_title": "Senior Graphics Head",
    "academic_year": "2024-2025",
    "added_by": 5,
    "created_at": "2024-04-17T10:30:00.000Z",
    "added_by_name": "John Doe",
    "society_name": "Drama Society"
  }
}
```

---

### 5. Delete Cabinet Member

```bash
curl -X DELETE http://localhost:5001/api/cabinet/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Cabinet member deleted successfully",
  "data": {
    "deleted_member": {
      "id": 1,
      "student_name": "Ahmed Hassan",
      "roll_number": "2021-CS-123",
      "custom_role_title": "Graphics Head"
    }
  }
}
```

---

## Testing Scenarios

### Scenario 1: Add Multiple Cabinet Members

```bash
# Add Graphics Head
curl -X POST http://localhost:5001/api/cabinet/add \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "society_id": 1,
    "student_name": "Ahmed Hassan",
    "roll_number": "2021-CS-123",
    "custom_role_title": "Graphics Head",
    "academic_year": "2023-2024"
  }'

# Add Event Manager
curl -X POST http://localhost:5001/api/cabinet/add \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "society_id": 1,
    "student_name": "Sara Ali",
    "roll_number": "2021-CS-124",
    "custom_role_title": "Event Manager",
    "academic_year": "2023-2024"
  }'

# Add Social Media Manager
curl -X POST http://localhost:5001/api/cabinet/add \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "society_id": 1,
    "student_name": "Fatima Khan",
    "roll_number": "2021-CS-125",
    "custom_role_title": "Social Media Manager",
    "academic_year": "2023-2024"
  }'
```

---

### Scenario 2: View Historical Cabinet (Different Years)

```bash
# Add members for 2022-2023
curl -X POST http://localhost:5001/api/cabinet/add \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "society_id": 1,
    "student_name": "Old President",
    "roll_number": "2020-CS-100",
    "custom_role_title": "President",
    "academic_year": "2022-2023"
  }'

# Add members for 2023-2024
curl -X POST http://localhost:5001/api/cabinet/add \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "society_id": 1,
    "student_name": "New President",
    "roll_number": "2021-CS-100",
    "custom_role_title": "President",
    "academic_year": "2023-2024"
  }'

# View all members (both years)
curl -X GET http://localhost:5001/api/cabinet/1 \
  -H "Authorization: Bearer YOUR_TOKEN"

# View only 2022-2023 members
curl -X GET "http://localhost:5001/api/cabinet/1?academic_year=2022-2023" \
  -H "Authorization: Bearer YOUR_TOKEN"

# View only 2023-2024 members
curl -X GET "http://localhost:5001/api/cabinet/1?academic_year=2023-2024" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Scenario 3: Update and Delete

```bash
# Add a member
curl -X POST http://localhost:5001/api/cabinet/add \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "society_id": 1,
    "student_name": "Test User",
    "roll_number": "2021-CS-999",
    "custom_role_title": "Test Role",
    "academic_year": "2023-2024"
  }'

# Update the member (assume ID is 1)
curl -X PUT http://localhost:5001/api/cabinet/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "custom_role_title": "Updated Test Role"
  }'

# Delete the member
curl -X DELETE http://localhost:5001/api/cabinet/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Error Testing

### Test 1: Missing Required Fields

```bash
curl -X POST http://localhost:5001/api/cabinet/add \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "society_id": 1,
    "student_name": "Test User"
  }'

# Expected: 400 Bad Request
# {
#   "success": false,
#   "error": "Missing required fields",
#   "message": "society_id, student_name, roll_number, custom_role_title, and academic_year are required"
# }
```

---

### Test 2: Invalid Academic Year Format

```bash
curl -X POST http://localhost:5001/api/cabinet/add \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "society_id": 1,
    "student_name": "Test User",
    "roll_number": "2021-CS-999",
    "custom_role_title": "Test Role",
    "academic_year": "2023"
  }'

# Expected: 400 Bad Request
# {
#   "success": false,
#   "error": "Validation error",
#   "message": "academic_year must be in format YYYY-YYYY (e.g., \"2023-2024\")"
# }
```

---

### Test 3: Society Not Found

```bash
curl -X POST http://localhost:5001/api/cabinet/add \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "society_id": 9999,
    "student_name": "Test User",
    "roll_number": "2021-CS-999",
    "custom_role_title": "Test Role",
    "academic_year": "2023-2024"
  }'

# Expected: 404 Not Found
# {
#   "success": false,
#   "error": "Society not found",
#   "message": "Society with ID 9999 does not exist"
# }
```

---

### Test 4: Insufficient Permissions

```bash
# Login as a regular student (not a society leader)
# Then try to add a cabinet member

curl -X POST http://localhost:5001/api/cabinet/add \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "society_id": 1,
    "student_name": "Test User",
    "roll_number": "2021-CS-999",
    "custom_role_title": "Test Role",
    "academic_year": "2023-2024"
  }'

# Expected: 403 Forbidden
# {
#   "success": false,
#   "error": "Insufficient permissions",
#   "message": "Only society leaders or coordinators can add cabinet members"
# }
```

---

### Test 5: No Authentication Token

```bash
curl -X GET http://localhost:5001/api/cabinet/1

# Expected: 401 Unauthorized
# {
#   "error": "Authentication required",
#   "message": "No token provided"
# }
```

---

## Using Postman

### Setup

1. Create a new collection: "Society Cabinet API"
2. Add environment variables:
   - `base_url`: `http://localhost:5001`
   - `token`: (will be set after login)

### Login Request

```
POST {{base_url}}/api/auth/login
Body (JSON):
{
  "email": "president1@uog.edu.pk",
  "password": "password123"
}

Tests (to save token):
pm.environment.set("token", pm.response.json().token);
```

### Cabinet Requests

All requests should have:
- **Authorization:** Bearer Token
- **Token:** `{{token}}`

---

## Verification Checklist

- [ ] Can add cabinet member as society leader
- [ ] Can add cabinet member as coordinator
- [ ] Cannot add cabinet member as regular student
- [ ] Can view all cabinet members
- [ ] Can filter by academic year
- [ ] Can get single member details
- [ ] Can update cabinet member
- [ ] Can delete cabinet member
- [ ] Validation errors return 400
- [ ] Authorization errors return 403
- [ ] Not found errors return 404
- [ ] All responses follow standard format

---

**Last Updated:** April 17, 2026  
**Version:** 1.0
