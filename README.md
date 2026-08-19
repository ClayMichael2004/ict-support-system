# ICT Support System

A comprehensive Help Desk and Ticket Management System designed for managing ICT support requests across multiple locations with role-based access control, real-time feedback, and complete audit logging.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Architecture & Design Patterns](#architecture--design-patterns)
- [Data Structures & Algorithms](#data-structures--algorithms)
- [Features & Functionalities](#features--functionalities)
- [Installation & Setup](#installation--setup)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Security Considerations](#security-considerations)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Future Enhancements](#future-enhancements)

---

## Project Overview

The **ICT Support System** is a full-stack web application that streamlines IT support operations by managing tickets, assigning officers to locations, collecting feedback, and maintaining complete audit trails. The system caters to three user roles:

- **Admins**: System administrators who manage officers, locations, and oversee all tickets
- **Officers**: Support professionals assigned to specific locations who handle and resolve tickets
- **Staff**: End-users who create support tickets and provide feedback

### Key Business Logic

1. **Ticket Workflow**: Staff members create tickets for specific locations → Officers assigned to those locations automatically receive the ticket → Officers update ticket status (OPEN → IN_PROGRESS → CLOSED) → Staff provides feedback after closure
2. **Location-based Assignment**: Each location has an assigned officer; new tickets automatically route to the responsible officer
3. **Feedback & Rating System**: After ticket closure, staff can rate the officer's performance with star ratings and comments
4. **Audit Compliance**: Every action (create, update, close) is logged for compliance and monitoring

---

## Technology Stack

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | LTS | JavaScript runtime for server-side execution |
| **Express.js** | 5.2.1 | RESTful API framework and middleware engine |
| **MySQL2** | 3.16.1 | Relational database and connection pooling |
| **JWT (jsonwebtoken)** | 9.0.3 | Token-based authentication and authorization |
| **bcrypt** / **bcryptjs** | 6.0.0 / 3.0.3 | Password hashing and cryptographic security |
| **CORS** | 2.8.6 | Cross-Origin Resource Sharing middleware |
| **dotenv** | 17.2.3 | Environment variable management |
| **Nodemon** | 3.1.11 | Development auto-reload utility |

### Frontend

| Technology | Purpose |
|-----------|---------|
| **Vanilla HTML5** | Semantic markup and page structure |
| **CSS3** | Responsive design and styling |
| **Vanilla JavaScript (ES6+)** | DOM manipulation and API interaction |
| **Fetch API** | Async HTTP requests with JWT authorization |

### Database

| Component | Details |
|-----------|---------|
| **DBMS** | MySQL 5.7+ |
| **Connection Pool** | MySQL2 promise-based connection pooling (10 connections, queue limit 0) |
| **Query Strategy** | Parameterized queries to prevent SQL injection |

---

## Architecture & Design Patterns

### Layered Architecture

```
┌─────────────────────────────────────┐
│      Frontend (Vanilla JS)          │
│  (Authentication, UI Components)    │
└──────────────┬──────────────────────┘
               │ HTTP/REST + JWT
┌──────────────▼──────────────────────┐
│   API Gateway & Routes              │
│   (Auth, Tickets, Officers, etc.)   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Controllers (Request Handlers)   │
│   (Input validation, error handling)│
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Services (Business Logic)         │
│ (Queries, calculations, workflows)  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Database Layer                    │
│   (MySQL via mysql2/promise)        │
└─────────────────────────────────────┘
```

### Design Patterns Implemented

1. **Controller-Service Pattern**: Separation of concerns between request handling (Controllers) and business logic (Services)
   - **Example**: `ticketsController` delegates to `ticketsService` for ticket operations
   
2. **Middleware Pattern**: Request processing pipeline for authentication, error handling, and CORS
   - **authMiddleware**: JWT verification and role extraction
   - **errorMiddleware**: Centralized error handling and response formatting
   
3. **Error Handling Pattern**: Custom `ApiError` class for operational errors with status codes
   - **Benefit**: Consistent error responses across all endpoints
   
4. **Async Handler Pattern**: Higher-order function wrapping async controllers to catch promise rejections
   ```javascript
   // Catches all errors and passes to error middleware
   const asyncHandler = fn => (req, res, next) => {
     Promise.resolve(fn(req, res, next)).catch(next);
   };
   ```
   
5. **Role-Based Access Control (RBAC)**: Dynamic route protection based on user roles
   - **Middleware Factory**: `protect(allowedRoles = [])` creates role-specific middleware
   
6. **JWT Token Pattern**: Stateless authentication with token-based authorization
   - **Token Payload**: `{ id, role, exp }`
   - **Validation**: Signature verification and expiration checking

---

## Data Structures & Algorithms

### Key Data Structures Used

#### 1. **Database Tables (Relational Structure)**

| Table | Columns | Purpose | Indexes |
|-------|---------|---------|---------|
| **users** | id, full_name, email, password (hashed), role_id, is_active | User accounts with roles | PRIMARY(id), UNIQUE(email), role_id |
| **roles** | id, name | Role definitions (ADMIN, OFFICER, STAFF) | PRIMARY(id) |
| **tickets** | id, title, description, status, user_id, location_id, assigned_officer_id, created_at, closed_at | Support requests | PRIMARY(id), FOREIGN(user_id), FOREIGN(location_id), FOREIGN(officer_id) |
| **locations** | id, name, building, officer_id, is_active | Physical office locations | PRIMARY(id), FOREIGN(officer_id) |
| **ticket_feedback** | id, ticket_id, rating, comment, is_read, created_at | Staff ratings on officers | PRIMARY(id), UNIQUE(ticket_id), FOREIGN(ticket_id) |
| **audit_logs** | id, user_id, action, entity, entity_id, created_at | Compliance tracking | PRIMARY(id), FOREIGN(user_id), created_at |

**Why Relational DB?**
- Enforces data integrity through foreign keys
- Efficient joins for complex queries (tickets + locations + officers)
- ACID compliance for transactional consistency
- Optimized for role-based filtering and sorting

#### 2. **Connection Pool (Resource Management)**

```javascript
const pool = mysql.createPool({
  connectionLimit: 10,      // Max 10 concurrent connections
  queueLimit: 0,            // Unlimited queue for waiting connections
  waitForConnections: true
});
```

**Why Used?**
- **Performance**: Reuses connections instead of creating new ones for each request
- **Scalability**: Handles 10+ concurrent users efficiently
- **Resource Control**: Prevents connection exhaustion

#### 3. **JWT Token (Authentication State)**

```javascript
{
  id: userId,
  role: roleEnum,
  exp: expirationTimestamp
}
```

**Algorithm**: HS256 (HMAC SHA-256)
- **Stateless**: No session storage required
- **Portable**: Can be sent with every request
- **Secure**: Signed with secret key to prevent tampering

#### 4. **Hash Map for Role Mapping**

```javascript
const roleMap = {
  1: 'ADMIN',
  2: 'OFFICER',
  3: 'STAFF'
};
```

**Purpose**: O(1) lookup time to convert numeric role_id to string role names

#### 5. **JavaScript Objects for Data Transfer**

```javascript
// Standardized response format
{
  success: boolean,
  data: object|array,
  message: string
}
```

**Why?** Consistent API contracts for frontend parsing

### Algorithms Implemented

#### 1. **Password Hashing Algorithm (bcrypt)**

**Location**: [src/controllers/admin.controller.js](src/controllers/admin.controller.js#L23), [src/services/auth.service.js](src/services/auth.service.js#L24)

```javascript
const hashedPassword = await bcrypt.hash(password, 12);
const passwordMatch = await bcrypt.compare(password, user.password);
```

**Algorithm Details**:
- **Cost Factor**: 12 (2^12 iterations = 4096 rounds)
- **Time Complexity**: O(n) where n = 2^costFactor
- **Why**: Slow hashing prevents brute-force attacks. 12 provides ~100ms per hash
- **Usage**: User login and officer creation

**Security Properties**:
- Salting: Automatic per-password
- Irreversible: Cannot decrypt hashed passwords
- Adaptive: Can increase cost factor as computing power increases

#### 2. **JWT Verification Algorithm**

**Location**: [src/middlewares/auth.middleware.js](src/middlewares/auth.middleware.js#L15)

```javascript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
// Checks:
// 1. Signature validity (HMAC-SHA256)
// 2. Token expiration (exp claim)
// 3. Format correctness (3 base64 parts)
```

**Steps**:
1. Split token into header.payload.signature
2. Verify signature using secret key
3. Check expiration timestamp against current time
4. Decode payload if all checks pass

**Time Complexity**: O(1) - fixed-size signature verification
**Why Used**: Validates token hasn't been tampered with or expired

#### 3. **SQL Query Optimization (JOIN Operations)**

**Location**: [src/services/feedback.service.js](src/services/feedback.service.js#L62)

```javascript
// Efficient single query instead of N+1
const [rows] = await pool.query(`
  SELECT f.id, f.rating, t.title, u.full_name
  FROM ticket_feedback f
  INNER JOIN tickets t ON f.ticket_id = t.id
  INNER JOIN users u ON t.user_id = u.id
  WHERE t.assigned_officer_id = ?
`);
```

**Optimization**: 
- **Without optimization (N+1 problem)**: 1 query to fetch feedback + N queries for each ticket = N+1 total
- **With JOIN**: 1 query fetches all data
- **Time Complexity**: O(n) instead of O(n²)
- **Database**: Uses indexes on foreign keys for fast joins

#### 4. **Role-based Filtering Algorithm**

**Location**: [src/services/tickets.service.js](src/services/tickets.service.js#L25)

```javascript
// Dynamic query construction based on role
if (role === 'ADMIN') {
  // See all tickets
  query = 'SELECT * FROM tickets';
} else if (role === 'OFFICER') {
  // See only assigned tickets
  query = 'SELECT * FROM tickets WHERE assigned_officer_id = ?';
  params = [user.id];
} else {
  // See only own tickets
  query = 'SELECT * FROM tickets WHERE user_id = ?';
  params = [user.id];
}
```

**Algorithm Type**: Conditional Logic with Parameterized Queries
- **Time Complexity**: O(n log n) - DB uses index on user_id/officer_id
- **Space Complexity**: O(n) - stores filtered results
- **Why**: Prevents unauthorized data access at database layer (defense-in-depth)

#### 5. **Permission Verification Algorithm**

**Location**: [src/services/tickets.service.js](src/services/tickets.service.js#L95)

```javascript
// Three-level permission check
const role = normalizeRole(user);

if (role === 'OFFICER' && ticket.assigned_officer_id !== user.id) {
  throw new ApiError(403, 'Unauthorized');
} else if (role === 'STAFF' && ticket.user_id !== user.id) {
  throw new ApiError(403, 'Unauthorized');
}
// ADMIN bypasses all checks
```

**Algorithm Type**: Access Control List (ACL) verification
- **Time Complexity**: O(1) - constant number of role checks
- **Why**: Ensures users can only access their own resources
- **Placement**: Both database query level AND application level (defense-in-depth)

#### 6. **Audit Logging Algorithm**

**Location**: [src/services/audit.service.js](src/services/audit.service.js#L3)

```javascript
const logAction = async ({ userId, action, entity, entityId }) => {
  await pool.query(
    'INSERT INTO audit_logs (...) VALUES (...)',
    [userId, action, entity, entityId]
  );
};
```

**Algorithm Type**: Event Logging / Write-Ahead Logging (WAL)
- **When Called**: After successful create/update/close operations
- **Time Complexity**: O(1) - single INSERT
- **Why**: Maintains immutable history for compliance audits
- **Benefit**: Can reconstruct state at any point in time

#### 7. **Email-based User Lookup**

**Location**: [src/services/auth.service.js](src/services/auth.service.js#L9)

```javascript
const [rows] = await pool.query(
  'SELECT * FROM users WHERE email = ?',
  [email]
);
```

**Algorithm Type**: Direct Index Lookup
- **Time Complexity**: O(log n) - using UNIQUE index on email column
- **Why**: Fast single-row retrieval for login validation
- **Constraint**: Email is UNIQUE so only 1 result possible

#### 8. **Unread Feedback Counter**

**Location**: [src/services/feedback.service.js](src/services/feedback.service.js#L99)

```javascript
const [rows] = await pool.query(`
  SELECT COUNT(*) AS count
  FROM ticket_feedback f
  INNER JOIN tickets t ON f.ticket_id = t.id
  WHERE t.assigned_officer_id = ? AND f.is_read = 0
`);
```

**Algorithm Type**: Aggregation (COUNT)
- **Time Complexity**: O(n) - but optimized by DB query planner
- **Why**: Provides notification badge count without loading all records
- **Use Case**: Real-time feedback notification on officer dashboard

---

## Features & Functionalities

### 1. **Authentication & Authorization**

**Functionality**: Secure login with JWT-based stateless authentication

**Endpoints**:
- `POST /api/auth/login` - User login with email/password

**Flow**:
1. User enters email and password on login page
2. Backend validates credentials against database
3. Password comparison using bcrypt.compare()
4. If valid, JWT token issued with user ID and role
5. Frontend stores token in localStorage
6. Subsequent requests include token in Authorization header

**Where Used**: [src/services/auth.service.js](src/services/auth.service.js), [src/controllers/auth.controller.js](src/controllers/auth.controller.js), [frontend/js/auth.js](frontend/js/auth.js)

**Why**: 
- JWT is stateless (no session storage needed)
- Scales horizontally (multiple servers can validate same token)
- Secure against CSRF attacks (token in header, not cookie)
- Automatic expiration (configurable TTL)

**Security**:
- Passwords hashed with bcrypt (12-round cost factor)
- Account status checked (is_active flag prevents disabled users)
- Invalid email/password returns same generic error (prevents user enumeration)

---

### 2. **Role-Based Access Control (RBAC)**

**Functionality**: Three-tier permission system controlling who can access what

**Roles**:
1. **ADMIN** (role_id = 1)
   - View all tickets system-wide
   - Manage officers (create, view, deactivate)
   - Manage locations (create, assign officers)
   - View audit logs
   
2. **OFFICER** (role_id = 2)
   - View only tickets assigned to their locations
   - Update ticket status (OPEN → IN_PROGRESS → CLOSED)
   - View feedback from staff about their performance
   - Receive notifications for new feedback
   
3. **STAFF** (role_id = 3)
   - Create support tickets for their location
   - View only their own tickets
   - Provide feedback/ratings after ticket closure
   - Cannot see other staff members' tickets

**Implementation**:
- **Middleware**: [src/middlewares/auth.middleware.js](src/middlewares/auth.middleware.js) - `protect(allowedRoles)` middleware factory
- **Service Layer**: Role checks in each service (belt-and-suspenders approach)

**Code Example**:
```javascript
// Route protection
router.patch('/:ticketId/status', protect(['OFFICER']), updateController);

// Service-level verification
if (user.role === 'OFFICER' && ticket.assigned_officer_id !== user.id) {
  throw new ApiError(403, 'Forbidden');
}
```

**Why**: 
- Multi-layer security prevents unauthorized access
- Database queries filtered by role (performance + security)
- Consistent error responses prevent information leakage

---

### 3. **Ticket Management System**

**Functionality**: Core feature for submitting, tracking, and resolving support requests

**Ticket Lifecycle**:
```
OPEN (initial state) 
  ↓ [Officer starts working]
IN_PROGRESS 
  ↓ [Officer resolves issue]
CLOSED (ready for feedback)
  ↓ [Staff rates officer]
[Feedback collected]
```

**Key Features**:

#### a) **Ticket Creation** [src/controllers/tickets.controller.js](src/controllers/tickets.controller.js#L6)
- **Input**: Description, location, category
- **Validation**: All fields required
- **Auto-assignment**: Officer is automatically assigned based on location
- **Database**: Inserts ticket with OPEN status

```javascript
// Automatic officer lookup and assignment
const [locationRows] = await pool.query(
  'SELECT officer_id FROM locations WHERE id = ?',
  [locationId]
);
const assignedOfficerId = locationRows[0].officer_id;
```

**Why**: Eliminates manual assignment, ensures correct routing, reduces errors

#### b) **Ticket Viewing** [src/services/tickets.service.js](src/services/tickets.service.js#L21)
- **Admin**: See all tickets system-wide
- **Officer**: See only tickets assigned to them
- **Staff**: See only their own tickets
- **Details**: Location name, assigned officer, ticket status, timestamps

#### c) **Ticket Status Updates** [src/services/tickets.service.js](src/services/tickets.service.js#L120)
- **Allowed Values**: OPEN, IN_PROGRESS, CLOSED
- **Permission**: Only assigned officer can update
- **On Close**: Records officer name and closure timestamp
- **Audit Trail**: Every update logged

**API Endpoints**:
- `GET /api/tickets` - Get tickets (filtered by role)
- `GET /api/tickets/:ticketId` - Get single ticket details
- `POST /api/tickets` - Create new ticket
- `PATCH /api/tickets/:ticketId/status` - Update status

**Where Used**: Staff dashboards, officer dashboards, admin oversight

---

### 4. **Officer Management**

**Functionality**: Admin controls for managing support staff

**Endpoints**:
- `GET /api/admin/officers` - List all officers
- `POST /api/admin/officers` - Create new officer

**Features**:
- Create officers with email and password
- Password hashed with bcrypt before storage
- Active/inactive status (soft delete)
- Assigned to specific locations
- Each location has exactly one officer

**Where Used**: [src/controllers/admin.controller.js](src/controllers/admin.controller.js#L18)

**Why Multiple Officers?**
- Distributes workload across locations
- Prevents bottlenecks
- Enables accountability (audit trail shows who handled each ticket)

---

### 5. **Location Management**

**Functionality**: Define office locations and assign responsible officers

**Endpoints**:
- `GET /api/admin/locations` - List all locations with assigned officers
- `POST /api/admin/locations` - Create new location

**Data Captured**:
- Location name (e.g., "Finance Department")
- Building info (e.g., "Building A, Floor 3")
- Assigned officer

**Business Logic**:
- When staff creates ticket for a location → automatically routes to that location's officer
- Officers see only tickets from their assigned location(s)

**Where Used**: Ticket creation (location selection), admin oversight

---

### 6. **Feedback & Rating System**

**Functionality**: Staff evaluates officer performance after ticket resolution

**Endpoints**:
- `POST /api/feedback` - Submit feedback/rating
- `GET /api/feedback/officer` - Officer views feedback on their tickets
- `GET /api/feedback/count` - Unread feedback count
- `PATCH /api/feedback/read` - Mark feedback as read

**Features**:
- **Timing**: Only available after ticket status = CLOSED
- **Rating Scale**: 1-5 stars
- **Comment**: Optional text feedback
- **Read Status**: Officers notified of unread feedback
- **Prevention**: Duplicate feedback blocked (one per ticket)

**Database Fields**: [src/services/feedback.service.js](src/services/feedback.service.js#L1)
- ticket_id
- rating (1-5 integer)
- comment (optional text)
- is_read (boolean, default 0)
- created_at (timestamp)

**Validation Logic**:
```javascript
// Only ticket creator can rate
if (ticket.user_id !== staffId) {
  throw new ApiError(403, 'Cannot rate others\' tickets');
}

// Only for closed tickets
if (ticket.status !== 'CLOSED') {
  throw new ApiError(400, 'Only rate closed tickets');
}

// Prevent duplicate feedback
const [existing] = await pool.query(
  'SELECT id FROM ticket_feedback WHERE ticket_id = ?',
  [ticketId]
);
if (existing.length > 0) {
  throw new ApiError(400, 'Already submitted feedback');
}
```

**Performance Consideration**: Uses INNER JOINs to fetch feedback with ticket/officer details in single query (avoids N+1)

**Use Case**: 
- Officers see aggregated ratings on dashboard
- Identify training needs or performance rewards
- Quality assurance metric

---

### 7. **Audit Logging System**

**Functionality**: Immutable record of all system actions for compliance

**Logged Events**:
- User login
- Officer creation/deactivation
- Location creation
- Ticket creation/status update/closure
- Feedback submission

**Database Fields**: [src/services/audit.service.js](src/services/audit.service.js#L1)
- user_id (who performed action)
- action (create, update, delete, close)
- entity (users, tickets, locations, feedback)
- entity_id (ID of affected record)
- created_at (timestamp, auto-generated)

**Endpoint**:
- `GET /api/audit` - Retrieve audit log (Admin only)

**Use Cases**:
- Compliance audits (regulatory requirement)
- Incident investigation ("Who changed this ticket?")
- Performance tracking (count tickets per officer)
- Historical reconstruction (replay all changes)

**Security**: Append-only (no updates to audit logs), logged immediately after successful operations

---

### 8. **Category Management**

**Functionality**: Organize tickets by issue type

**Endpoints**:
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category

**Purpose**: When staff creates ticket, they select category (e.g., "Hardware", "Software", "Network")

**Where Used**: Ticket creation form, filtering/reporting

---

### 9. **Staff Management**

**Functionality**: Officers can manage staff accounts assigned to them

**Endpoints**:
- `GET /api/officer/staff` - View staff in officer's locations
- `POST /api/officer/staff` - Create staff account

**Why**: Officers onboard new staff, track their productivity

---

### 10. **Dashboard Interfaces**

**Admin Dashboard** [frontend/admin-dashboard.html](frontend/admin-dashboard.html):
- Overview cards (total officers, locations, open/closed tickets)
- Officer management table
- Location management
- Ticket overview
- Audit logs viewer

**Officer Dashboard** [frontend/officer-dashboard.html](frontend/officer-dashboard.html):
- Tickets assigned to them
- Status update controls
- Feedback notifications badge
- Performance metrics (average rating)

**Staff Dashboard** [frontend/staff-dashboard.html](frontend/staff-dashboard.html):
- Create new ticket form
- View own tickets and status
- Submit feedback/rating on closed tickets
- Ticket history

---

## Installation & Setup

### Prerequisites

- **Node.js** 14+ and npm
- **MySQL** 5.7+
- **Git** (for version control)

### Step 1: Clone Repository

```bash
cd /home/michaelochieng0/ict-support-system
npm install
```

### Step 2: Environment Configuration

Create `.env` file in project root:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=icthelpdesk
DB_PORT=3306

# JWT
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d

# Frontend (if needed)
REACT_APP_API_URL=http://localhost:5000
```

### Step 3: Database Setup

Create MySQL database and tables:

```sql
-- Create database
CREATE DATABASE icthelpdesk;
USE icthelpdesk;

-- Create roles table
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO roles (name) VALUES ('ADMIN'), ('OFFICER'), ('STAFF');

-- Create users table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Create locations table
CREATE TABLE locations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  building VARCHAR(255),
  officer_id INT NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (officer_id) REFERENCES users(id)
);

-- Create categories table
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tickets table
CREATE TABLE tickets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('OPEN', 'IN_PROGRESS', 'CLOSED') DEFAULT 'OPEN',
  user_id INT NOT NULL,
  location_id INT NOT NULL,
  assigned_officer_id INT NOT NULL,
  category_id INT,
  solved_by_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (location_id) REFERENCES locations(id),
  FOREIGN KEY (assigned_officer_id) REFERENCES users(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Create ticket feedback table
CREATE TABLE ticket_feedback (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ticket_id INT UNIQUE NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_read BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id)
);

-- Create audit logs table
CREATE TABLE audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entity_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX idx_user_role ON users(role_id);
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_location_officer ON locations(officer_id);
CREATE INDEX idx_ticket_user ON tickets(user_id);
CREATE INDEX idx_ticket_officer ON tickets(assigned_officer_id);
CREATE INDEX idx_ticket_status ON tickets(status);
CREATE INDEX idx_feedback_ticket ON ticket_feedback(ticket_id);
CREATE INDEX idx_feedback_read ON ticket_feedback(is_read);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
```

### Step 4: Create Seed Admin Account

Edit [src/scripts/seedAdmin.js](src/scripts/seedAdmin.js) with admin credentials:

```bash
node src/scripts/seedAdmin.js
```

### Step 5: Start Development Server

```bash
npm run dev
```

Server will run on `http://localhost:5000`

---

## API Documentation

### Authentication

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}

Response (200):
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "full_name": "Admin User",
      "email": "admin@example.com",
      "role": "ADMIN"
    }
  }
}
```

### Tickets

#### Get All Tickets (Role-filtered)
```
GET /api/tickets
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Category 2",
      "description": "Cannot print documents",
      "status": "OPEN",
      "user_id": 3,
      "location_id": 1,
      "assigned_officer_id": 2,
      "created_at": "2024-01-15T10:30:00Z",
      "location_name": "Finance Department"
    }
  ]
}
```

#### Get Single Ticket
```
GET /api/tickets/:ticketId
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Printer Issue",
    "description": "Printer not responding",
    "status": "IN_PROGRESS",
    "user_id": 3,
    "location_id": 1,
    "assigned_officer_id": 2,
    "location_name": "Finance Department",
    "location_building": "Building A, Floor 2",
    "user_full_name": "John Doe",
    "user_email": "john@example.com",
    "officer_full_name": "Jane Smith",
    "created_at": "2024-01-15T10:30:00Z",
    "closed_at": null
  }
}
```

#### Create Ticket
```
POST /api/tickets
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Cannot connect to WiFi",
  "locationId": 1,
  "categoryId": 2
}

Response (201):
{
  "success": true,
  "data": {
    "id": 5,
    "title": "Category 2",
    "description": "Cannot connect to WiFi",
    "status": "OPEN",
    "user_id": 3,
    "location_id": 1,
    "assigned_officer_id": 2
  }
}
```

#### Update Ticket Status
```
PATCH /api/tickets/:ticketId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "IN_PROGRESS"
}

Response (200):
{
  "success": true,
  "data": {
    "id": 1,
    "status": "IN_PROGRESS",
    "updated_at": "2024-01-15T11:45:00Z"
  }
}
```

### Admin Operations

#### Get All Officers
```
GET /api/admin/officers
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": [
    {
      "id": 2,
      "fullName": "Jane Smith",
      "email": "jane@example.com"
    }
  ]
}
```

#### Create Officer
```
POST /api/admin/officers
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Mark Johnson",
  "email": "mark@example.com",
  "password": "SecurePass123!"
}

Response (201):
{
  "success": true,
  "message": "Officer added successfully"
}
```

#### Get All Locations
```
GET /api/admin/locations
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Finance Department",
      "building": "Building A, Floor 2",
      "officerName": "Jane Smith"
    }
  ]
}
```

#### Create Location
```
POST /api/admin/locations
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "HR Department",
  "building": "Building B, Floor 1",
  "officerId": 2
}

Response (201):
{
  "success": true,
  "message": "Location added successfully"
}
```

### Feedback

#### Submit Feedback (Staff)
```
POST /api/feedback
Authorization: Bearer <token>
Content-Type: application/json

{
  "ticketId": 1,
  "rating": 5,
  "comment": "Officer was very helpful and resolved quickly!"
}

Response (201):
{
  "success": true,
  "message": "Feedback submitted successfully",
  "data": {
    "id": 1,
    "ticketId": 1,
    "rating": 5,
    "comment": "Officer was very helpful..."
  }
}
```

#### Get Officer Feedback
```
GET /api/feedback/officer
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ticket_id": 1,
      "rating": 5,
      "comment": "Great service",
      "is_read": 0,
      "created_at": "2024-01-15T14:20:00Z",
      "ticket_title": "Printer Issue",
      "staff_name": "John Doe",
      "staff_email": "john@example.com"
    }
  ]
}
```

#### Get Unread Feedback Count
```
GET /api/feedback/count
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "count": 3
  }
}
```

### Audit Logs

#### Get All Audit Logs
```
GET /api/audit
Authorization: Bearer <token>

Response (200):
{
  "status": "success",
  "results": 15,
  "data": [
    {
      "id": 1,
      "user": "Jane Smith",
      "action": "UPDATE",
      "entity": "tickets",
      "entity_id": 1,
      "created_at": "2024-01-15T11:45:00Z"
    }
  ]
}
```

---

## Database Schema

### Entity Relationship Diagram (Conceptual)

```
┌──────────────┐         ┌────────────┐
│    roles     │         │   users    │
│  id (PK)     │◄───┐    │  id (PK)   │
│  name        │    └────│  role_id   │
└──────────────┘         │  email     │
                         │  password  │
                         │  is_active │
                         └──────┬─────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
            ┌───────▼───┐ ┌────▼────┐  ┌──▼──────────┐
            │ locations │ │ tickets  │  │ audit_logs  │
            │ id (PK)   │ │ id (PK)  │  │ id (PK)     │
            │ officer_id├─┤ user_id  │  │ user_id (FK)│
            │  (FK)     │ │ location ├──┤ entity      │
            │           │ │ assigned ├──┤ entity_id   │
            │           │ │ officer  │  │             │
            │           │ └────┬─────┘  └─────────────┘
            └───────────┘      │
                               │
                         ┌─────▼──────────┐
                         │ ticket_feedback│
                         │ id (PK)        │
                         │ ticket_id (FK) │
                         │ rating         │
                         │ comment        │
                         │ is_read        │
                         └────────────────┘

FK = Foreign Key
PK = Primary Key
```

### Key Constraints

1. **Referential Integrity**: All foreign keys cascade on update
2. **Unique Constraints**: 
   - users.email (prevents duplicate logins)
   - ticket_feedback.ticket_id (one feedback per ticket)
3. **Check Constraints**: feedback rating between 1-5
4. **Default Values**:
   - users.is_active = 1
   - tickets.status = 'OPEN'
   - ticket_feedback.is_read = 0
5. **Indexes**: Foreign key columns indexed for fast JOINs

---

## Role-Based Access Control (RBAC)

### Access Matrix

| Feature | Admin | Officer | Staff |
|---------|-------|---------|-------|
| View all tickets | ✅ | ❌ (own assigned) | ❌ (own) |
| Create ticket | ❌ | ❌ | ✅ |
| Update ticket status | ❌ | ✅ (assigned only) | ❌ |
| Close ticket | ❌ | ✅ | ❌ |
| View feedback | ✅ | ✅ (on own tickets) | ❌ |
| Submit feedback | ❌ | ❌ | ✅ (on closed) |
| Create officer | ✅ | ❌ | ❌ |
| Create location | ✅ | ❌ | ❌ |
| View audit logs | ✅ | ❌ | ❌ |
| Manage staff | ❌ | ✅ (in location) | ❌ |

### Implementation Strategy

**Layered Security** (Defense-in-Depth):

```
Layer 1: Route Protection
  ↓ (protect middleware verifies JWT & role)
Layer 2: Service Validation
  ↓ (business logic double-checks permissions)
Layer 3: Database Queries
  ↓ (filtered by user_id/officer_id)
Layer 4: Data Encryption
  (passwords hashed, sensitive data protected)
```

---

## Security Considerations

### 1. Authentication Security

- **JWT Secrets**: Use strong, random secret keys (minimum 32 characters)
- **Token Expiration**: Set reasonable TTL (default 7 days)
- **HTTPS Only**: In production, always use HTTPS to prevent token interception
- **Secure Storage**: Tokens stored in localStorage (vulnerable to XSS) → consider httpOnly cookies

### 2. Password Security

- **Hashing Algorithm**: bcrypt with 12-round cost factor
- **Hash Time**: ~100ms per hash prevents brute-force attacks
- **Per-Password Salts**: Automatically generated, prevents rainbow tables
- **No Plain Text**: Passwords never logged or transmitted unencrypted

### 3. SQL Injection Prevention

- **Parameterized Queries**: All queries use `?` placeholders
- **Type Safety**: mysql2 validates parameter types
- **Example** (secure):
  ```javascript
  await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
  ```
- **Example** (vulnerable - never do this):
  ```javascript
  await pool.query(`SELECT * FROM users WHERE id = ${userId}`); // VULNERABLE
  ```

### 4. Authorization Security

- **Role Verification**: Every endpoint checks user role
- **Resource Ownership**: Users can only access own resources
- **No Privilege Escalation**: Cannot elevate own role
- **Audit Trail**: All actions logged for investigation

### 5. Data Validation

- **Input Sanitization**: Validate email format, string lengths
- **Type Checking**: Ensure fields match expected types
- **Error Messages**: Generic error responses prevent information leakage
  - ✅ Good: "Invalid email or password"
  - ❌ Bad: "User not found" (reveals email existence)

### 6. CORS Configuration

```javascript
app.use(cors());
```

**Current Issue**: Allows all origins. For production:
```javascript
app.use(cors({
  origin: 'https://yourdomain.com',
  credentials: true
}));
```

### 7. Environment Secrets

- **Never commit**: `.env` file should be in `.gitignore`
- **Use environment variables** for:
  - JWT_SECRET
  - DB_PASSWORD
  - API_KEYS
  - NODE_ENV (production/development)

### 8. Soft Deletes

- **Pattern Used**: `is_active` flag instead of hard deletes
- **Benefit**: Maintains referential integrity, allows data recovery
- **Example**: 
  ```javascript
  WHERE role_id = 2 AND is_active = 1  // Only get active officers
  ```

### 9. Audit Logging

- **Append-Only**: Audit logs never deleted or updated
- **Immutable History**: Cannot tamper with past actions
- **Investigation Tool**: Can replay all changes, identify who did what
- **Compliance**: Meets regulatory requirements

### 10. Error Handling

- **No Stack Traces**: Frontend never sees stack traces
- **Consistent Responses**: All errors follow same format
  ```json
  {
    "success": false,
    "message": "User-friendly error message"
  }
  ```
- **Status Codes**: Proper HTTP status (401, 403, 404, 500)

---

## Project Structure

```
ict-support-system/
├── package.json                    # Dependencies and scripts
├── .env                            # Environment configuration (git-ignored)
├── README.md                       # This file
│
├── src/                            # Backend source code
│   ├── server.js                   # Server entry point
│   ├── app.js                      # Express app setup & routes
│   │
│   ├── config/
│   │   └── db.js                   # MySQL connection pool
│   │
│   ├── controllers/                # Request handlers (input validation)
│   │   ├── auth.controller.js      # Login endpoint
│   │   ├── admin.controller.js     # Officer & location management
│   │   ├── tickets.controller.js   # Ticket CRUD
│   │   ├── officers.controller.js  # Officer operations
│   │   ├── staff.controller.js     # Staff operations
│   │   ├── feedback.controller.js  # Feedback submission & retrieval
│   │   ├── audit.controller.js     # Audit log retrieval
│   │   ├── categories.controller.js # Category management
│   │   ├── locations.controller.js # Location operations
│   │
│   ├── services/                   # Business logic layer
│   │   ├── auth.service.js         # Login validation (password check)
│   │   ├── tickets.service.js      # Ticket CRUD logic & role filtering
│   │   ├── feedback.service.js     # Feedback submission & queries
│   │   ├── audit.service.js        # Audit logging
│   │   ├── officers.service.js     # Officer operations
│   │   ├── locations.service.js    # Location operations
│   │   ├── categories.service.js   # Category operations
│   │   ├── staff.service.js        # Staff operations
│   │
│   ├── middlewares/                # Request/response middleware
│   │   ├── auth.middleware.js      # JWT verification & role extraction
│   │   └── error.middleware.js     # Global error handler
│   │
│   ├── models/                     # Data models (schema definitions)
│   │   ├── user.model.js           # User schema (currently empty)
│   │   └── ticket.model.js         # Ticket schema (currently empty)
│   │
│   ├── routes/                     # Express route definitions
│   │   ├── auth.routes.js          # POST /api/auth/login
│   │   ├── admin.routes.js         # Admin endpoints
│   │   ├── tickets.routes.js       # Ticket endpoints
│   │   ├── officers.routes.js      # Officer endpoints
│   │   ├── locations.routes.js     # Location endpoints
│   │   ├── feedback.routes.js      # Feedback endpoints
│   │   ├── audit.routes.js         # Audit endpoints
│   │   ├── categories.routes.js    # Category endpoints
│   │
│   ├── scripts/
│   │   └── seedAdmin.js            # Database seeding script
│   │
│   └── utils/                      # Utility functions
│       ├── ApiError.js             # Custom error class
│       └── asyncHandler.js         # Async error wrapper
│
└── frontend/                       # Client-side code
    ├── index.html                  # Landing page
    ├── login.html                  # Login form
    ├── admin-dashboard.html        # Admin interface
    ├── officer-dashboard.html      # Officer interface
    ├── staff-dashboard.html        # Staff interface
    │
    ├── css/
    │   ├── styles.css              # Global styles
    │   ├── login.css               # Login page styles
    │   └── dashboard.css           # Dashboard styles
    │
    └── js/
        ├── main.js                 # Global initialization
        ├── auth.js                 # Login form handler
        ├── auth-helper.js          # JWT token utilities
        ├── admin-dashboard.js      # Admin dashboard logic
        ├── officer-dashboard.js    # Officer dashboard logic
        ├── staff-dashboard.js      # Staff dashboard logic
        ├── tickets.js              # Ticket operations
        └── feedback.js             # Feedback submission
```

### File Responsibilities

| File | Responsibility | Lines of Code |
|------|-----------------|---------------|
| app.js | Route registration, middleware setup | ~50 |
| server.js | Server startup | ~5 |
| auth.controller.js | Handle login requests | ~30 |
| auth.service.js | Validate credentials, bcrypt compare | ~35 |
| tickets.service.js | CRUD logic, role-based filtering | ~160 |
| feedback.service.js | Rating/comment submission, aggregation | ~130 |
| auth.middleware.js | JWT verification, role extraction | ~60 |
| error.middleware.js | Error response formatting | ~15 |
| admin.controller.js | Handle admin requests | ~100+ |

---

## Development Workflow

### Starting the Server

```bash
npm run dev
```

This uses **nodemon** to:
- Watch for file changes
- Automatically restart server
- Log changes to console

### Making API Calls

#### Using cURL:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

#### Using Postman:
1. Import API collection
2. Set Authorization: Bearer <token>
3. Execute requests

#### Using Frontend:
1. Open http://localhost:5000 in browser
2. Login with credentials
3. Navigate through role-specific dashboard

### Debugging

**Enable Debug Logging**:
```javascript
// In auth.middleware.js
console.log('🔐 Auth Debug:', decoded);
console.log('  User Role:', req.user.role);
```

**Database Queries**:
```javascript
// Log all queries
pool.on('connection', (connection) => {
  connection.on('query', (query) => {
    console.log('SQL:', query.sql);
  });
});
```

**JWT Decoding**:
```javascript
// Paste token at jwt.io
// See payload: { id, role, exp, iat }
```

---

## Future Enhancements

### Short Term (Next Sprint)

1. **Email Notifications**
   - Alert officers when new ticket assigned
   - Notify staff when ticket status changes
   - Send feedback notification to officers
   - **Technology**: Nodemailer + SMTP

2. **Real-time Updates**
   - Live ticket status updates
   - Instant feedback notifications
   - **Technology**: Socket.io / WebSockets

3. **File Attachments**
   - Upload screenshots/documents to tickets
   - Store in cloud (S3/Azure Blob)
   - **Database**: Add file_url column to tickets

4. **Advanced Search/Filtering**
   - Filter by date range, status, officer, location
   - Full-text search on descriptions
   - **Technology**: Elasticsearch or MySQL full-text indexes

### Medium Term (Next Quarter)

5. **Analytics & Reporting**
   - Officer performance dashboard (avg rating, resolution time)
   - Ticket volume trends
   - Peak support hours analysis
   - **Technology**: Chart.js / D3.js for visualization

6. **SLA (Service Level Agreement) Tracking**
   - Define target resolution times per category
   - Alert when SLA breached
   - Track compliance metrics
   - **Database**: Add sla_hours, breach_at columns

7. **Knowledge Base Integration**
   - Self-service articles for common issues
   - Link articles to ticket categories
   - Reduce ticket volume
   - **Technology**: Markdown + search

8. **Mobile App**
   - React Native app for officers (on-the-go)
   - Push notifications
   - **Technology**: React Native + Expo

### Long Term (Next Year)

9. **AI-Powered Features**
   - Chatbot for ticket creation
   - Auto-categorization of tickets
   - Suggested solutions based on history
   - **Technology**: NLP, TensorFlow, or OpenAI API

10. **Multi-tenant Support**
    - Support multiple organizations in one system
    - Tenant isolation
    - Billing per tenant
    - **Architecture**: Tenant ID in all queries

11. **Workflow Automation**
    - Assign tickets to round-robin queue
    - Escalation rules (unresolved after 24h)
    - Auto-close low-priority tickets
    - **Technology**: Node-schedule, bull queues

12. **Advanced Authentication**
    - Two-factor authentication (2FA)
    - SSO integration (LDAP/Active Directory)
    - OAuth2 (Google, Microsoft login)
    - **Technology**: Passport.js

---

## Contributing

### Code Style

- Use ES6+ syntax
- Follow consistent indentation (2 spaces)
- Add JSDoc comments for functions
- Validate inputs at controller level

### Testing

```bash
# Run tests (to be implemented)
npm test

# Run specific test file
npm test -- tickets.test.js
```

### Commit Messages

```
feat: Add feedback notification system
fix: Prevent duplicate feedback submission
docs: Update API documentation
refactor: Extract database queries to service layer
```

---

## License

ISC License - See package.json

---

## Support & Contact

For questions or issues:
1. Check existing issues on repository
2. Create detailed bug report with steps to reproduce
3. Contact development team at dev@company.com

---

## Changelog

### v1.0.0 (Current Release)

- ✅ Complete authentication system (JWT + bcrypt)
- ✅ Ticket lifecycle management (OPEN → IN_PROGRESS → CLOSED)
- ✅ Role-based access control (ADMIN, OFFICER, STAFF)
- ✅ Location-based ticket routing
- ✅ Feedback & rating system
- ✅ Comprehensive audit logging
- ✅ Admin dashboard for system oversight
- ✅ Officer dashboard for ticket management
- ✅ Staff dashboard for ticket submission & feedback

### Planned for v1.1.0

- Real-time notifications
- Email alerts
- Advanced analytics
- Performance dashboard

---

## Appendix A: Common Issues & Troubleshooting

### Issue: "JWT Expired"
**Solution**: Token expires after 7 days. Re-login to get new token.
**Workaround**: Increase JWT_EXPIRES_IN in .env (not recommended for security)

### Issue: "Cannot access ticket"
**Cause**: Permission denied (not owner, not assigned officer, not admin)
**Solution**: Verify user role and ticket assignment in database

### Issue: "Database connection failed"
**Cause**: MySQL not running or credentials wrong
**Solution**: 
```bash
# Check MySQL status
sudo systemctl status mysql

# Test connection
mysql -u root -p -h localhost icthelpdesk
```

### Issue: "Ticket not auto-assigned to officer"
**Cause**: Location has no officer assigned
**Solution**: Go to admin dashboard → Locations → Assign officer to location

---

## Appendix B: Performance Tuning

### Database Optimization

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_created ON tickets(created_at);
CREATE INDEX idx_feedback_read ON ticket_feedback(is_read);

-- Analyze query performance
EXPLAIN SELECT * FROM tickets WHERE assigned_officer_id = ? AND status = 'OPEN';
```

### Connection Pool Tuning

```javascript
const pool = mysql.createPool({
  connectionLimit: 20,  // Increase for higher concurrency
  queueLimit: 50,      // Limit queue to prevent memory leak
  waitForConnections: true,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
});
```

### Query Optimization

- Always use indexes on WHERE clauses
- Use JOINs instead of N+1 queries
- Limit result sets (pagination)
- Avoid SELECT * (choose specific columns)

---

## Appendix C: Environment Variables Reference

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| PORT | number | 5000 | Server port |
| NODE_ENV | string | development | Environment mode |
| DB_HOST | string | localhost | MySQL hostname |
| DB_USER | string | root | MySQL user |
| DB_PASSWORD | string | (empty) | MySQL password |
| DB_NAME | string | icthelpdesk | Database name |
| DB_PORT | number | 3306 | MySQL port |
| JWT_SECRET | string | (required) | Token signing key |
| JWT_EXPIRES_IN | string | 7d | Token expiration time |

---

**Document Version**: 1.0.0  
**Last Updated**: August 19, 2026  
**Maintained By**: Development Team
