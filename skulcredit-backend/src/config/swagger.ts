import env from './env';

const swaggerSpec: Record<string, any> = {
  openapi: '3.0.0',
  info: {
    title: 'SkulCredit API',
    version: '1.0.0',
    description: 'School-fee financing platform API. Supports three portals: Parent, School, and Admin.',
    contact: { name: 'SkulCredit Engineering' },
  },
  servers: [
    { url: `http://localhost:${env.port}/api/v1`, description: 'Local development' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data:    { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          errors:  { type: 'array', items: { type: 'object' } },
        },
      },
      RegisterParent: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'password', 'phoneNumber'],
        properties: {
          firstName:   { type: 'string', example: 'John' },
          middleName:  { type: 'string', example: 'Michael', description: 'Optional' },
          lastName:    { type: 'string', example: 'Doe' },
          email:       { type: 'string', format: 'email', example: 'parent@example.com' },
          phoneNumber: { type: 'string', example: '08011111111' },
          password:    { type: 'string', format: 'password', minLength: 8, example: 'Secret@123' },
        },
      },
      RegisterSchool: {
        type: 'object',
        required: ['schoolName', 'contactPerson', 'email', 'password', 'phoneNumber'],
        properties: {
          schoolName:    { type: 'string', example: 'Greenwood High School' },
          contactPerson: { type: 'string', example: 'Jane Principal' },
          email:         { type: 'string', format: 'email', example: 'school@example.com' },
          phoneNumber:   { type: 'string', example: '08022222222' },
          password:      { type: 'string', format: 'password', minLength: 8, example: 'Secret@123' },
        },
      },
      Login: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email:    { type: 'string', format: 'email', example: 'parent@example.com' },
          password: { type: 'string', format: 'password', example: 'Secret@123' },
        },
      },
      RefreshToken: {
        type: 'object',
        required: ['token'],
        properties: { token: { type: 'string', example: 'abc123refreshtoken...' } },
      },
      SendOtp: {
        type: 'object',
        required: ['email'],
        properties: { email: { type: 'string', format: 'email', example: 'parent@example.com' } },
      },
      VerifyOtp: {
        type: 'object',
        required: ['email', 'otp'],
        properties: {
          email: { type: 'string', format: 'email' },
          otp:   { type: 'string', example: '482910' },
        },
      },
      ForgotPassword: {
        type: 'object',
        required: ['email'],
        properties: { email: { type: 'string', format: 'email' } },
      },
      ResetPassword: {
        type: 'object',
        required: ['token', 'password'],
        properties: {
          token:    { type: 'string' },
          password: { type: 'string', format: 'password' },
        },
      },
      CompleteProfile: {
        type: 'object',
        properties: {
          middleName:        { type: 'string' },
          dob:               { type: 'string', format: 'date', example: '1988-05-14' },
          addressStreet:     { type: 'string' },
          addressCity:       { type: 'string' },
          addressState:      { type: 'string' },
          addressPostalCode: { type: 'string' },
          addressCountry:    { type: 'string' },
        },
      },
      VerifyKYC: {
        type: 'object',
        required: ['bvn'],
        properties: {
          bvn: { type: 'string', example: '12345678901' },
          nin: { type: 'string', example: '98765432109' },
        },
      },
      AddStudent: {
        type: 'object',
        required: ['firstName', 'lastName', 'gradeLevel', 'tuitionAmount', 'schoolId'],
        properties: {
          firstName:     { type: 'string', example: 'Amara' },
          lastName:      { type: 'string', example: 'Doe' },
          studentId:     { type: 'string', example: 'GWH/2025/001' },
          gradeLevel:    { type: 'string', example: 'JSS 2' },
          tuitionAmount: { type: 'number', example: 250000 },
          schoolId:      { type: 'string', format: 'uuid' },
        },
      },
      CompleteSchoolRegistration: {
        type: 'object',
        properties: {
          website:         { type: 'string' },
          population:      { type: 'string' },
          addressStreet:   { type: 'string' },
          addressCity:     { type: 'string' },
          addressState:    { type: 'string' },
          addressCountry:  { type: 'string' },
          documentCac:     { type: 'string' },
          documentLicense: { type: 'string' },
        },
      },
      UpdateBankDetails: {
        type: 'object',
        required: ['bankName', 'accountName', 'accountNumber'],
        properties: {
          bankName:      { type: 'string', example: 'GTBank' },
          accountName:   { type: 'string', example: 'Greenwood High School' },
          accountNumber: { type: 'string', example: '0123456789' },
        },
      },
      CheckEligibility: {
        type: 'object',
        required: ['amount'],
        properties: { amount: { type: 'number', example: 200000 } },
      },
      ApplyLoan: {
        type: 'object',
        required: ['studentId', 'amount', 'tenor'],
        properties: {
          studentId: { type: 'string', format: 'uuid' },
          amount:    { type: 'number', example: 200000 },
          tenor:     { type: 'integer', example: 3 },
        },
      },
      InitializePayment: {
        type: 'object',
        required: ['amount'],
        properties: {
          amount:   { type: 'number', example: 50000 },
          metadata: { type: 'object', example: { loanId: 'abc123' } },
        },
      },
      RegisterDeviceToken: {
        type: 'object',
        required: ['token', 'platform'],
        properties: {
          token:    { type: 'string', example: 'fcm_device_token_here' },
          platform: { type: 'string', enum: ['ios', 'android', 'web'] },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  tags: [
    { name: 'Auth',     description: 'Registration, login, token management, email verification, OTP, password recovery' },
    { name: 'Parent',   description: 'Parent profile, students, applications, schools (role: parent)' },
    { name: 'School',   description: 'School portal — profile, applications, enrollment verification (role: school)' },
    { name: 'Admin',    description: 'Internal operations — schools, parents, loans (role: admin)' },
    { name: 'Loans',    description: 'Loan eligibility check and application (role: parent)' },
    { name: 'Payments', description: 'Paystack payment initialization and verification' },
    { name: 'Upload',         description: 'Document upload to Cloudinary' },
    { name: 'Notifications', description: 'In-app notifications — list, mark read, device token management' },
    { name: 'Health',        description: 'Server health check' },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Server health check',
        tags: ['Health'],
        security: [],
        responses: { '200': { description: 'Server is running' } },
      },
    },

    // ── Auth ────────────────────────────────────────────────────────────────

    '/auth/register/parent': {
      post: {
        summary: 'Register a new parent account',
        tags: ['Auth'],
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterParent' } } } },
        responses: {
          '201': { description: 'Parent registered. Verification email sent.' },
          '400': { description: 'Validation error or email already in use' },
        },
      },
    },
    '/auth/register/school': {
      post: {
        summary: 'Register a new school account',
        tags: ['Auth'],
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterSchool' } } } },
        responses: {
          '201': { description: 'School registered. Verification email sent.' },
          '400': { description: 'Validation error or email already in use' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login with email and password',
        description: 'Returns accessToken and refreshToken. Account locks for 15 min after 5 failed attempts.',
        tags: ['Auth'],
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Login' } } } },
        responses: {
          '200': { description: 'Login successful' },
          '401': { description: 'Invalid credentials' },
          '429': { description: 'Account temporarily locked' },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Logout the authenticated user',
        tags: ['Auth'],
        responses: { '200': { description: 'Logout successful' } },
      },
    },
    '/auth/refresh-token': {
      post: {
        summary: 'Exchange a refresh token for a new access token',
        tags: ['Auth'],
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshToken' } } } },
        responses: {
          '200': { description: 'New access token issued' },
          '401': { description: 'Invalid or expired refresh token' },
        },
      },
    },
    '/auth/verify-email': {
      get: {
        summary: 'Confirm email address via the verification link',
        tags: ['Auth'],
        security: [],
        parameters: [{ in: 'query', name: 'token', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Email verified successfully' },
          '400': { description: 'Token invalid or expired' },
        },
      },
    },
    '/auth/resend-verification': {
      post: {
        summary: 'Resend the email verification link',
        tags: ['Auth'],
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } } } } },
        responses: { '200': { description: 'Verification email sent' } },
      },
    },
    '/auth/forgot-password': {
      post: {
        summary: 'Request a password reset link (valid 15 minutes)',
        description: 'Always returns 200 regardless of whether the email exists — prevents enumeration.',
        tags: ['Auth'],
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ForgotPassword' } } } },
        responses: { '200': { description: 'Reset link sent if account exists' } },
      },
    },
    '/auth/reset-password': {
      post: {
        summary: 'Set a new password using the reset token',
        tags: ['Auth'],
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ResetPassword' } } } },
        responses: {
          '200': { description: 'Password reset successfully' },
          '400': { description: 'Token invalid or expired' },
        },
      },
    },
    '/auth/send-otp': {
      post: {
        summary: 'Send a 6-digit OTP to an email (valid 30 minutes)',
        tags: ['Auth'],
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SendOtp' } } } },
        responses: { '200': { description: 'OTP sent successfully' } },
      },
    },
    '/auth/verify-otp': {
      post: {
        summary: 'Verify a previously sent OTP',
        tags: ['Auth'],
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/VerifyOtp' } } } },
        responses: {
          '200': { description: 'OTP verified successfully' },
          '400': { description: 'Invalid or expired OTP' },
        },
      },
    },
    '/auth/admin/create': {
      post: {
        summary: 'Create a new admin account (requires existing admin token)',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password' }, phoneNumber: { type: 'string' } } } } },
        },
        responses: {
          '201': { description: 'Admin account created' },
          '403': { description: 'Admin role required' },
        },
      },
    },

    '/admin/dashboard': {
      get: {
        summary: 'Get admin portfolio overview stats',
        tags: ['Admin'],
        responses: { '200': { description: 'Dashboard stats returned' } },
      },
    },
    '/admin/schools': {
      get: {
        summary: 'List all schools, optionally filtered by status',
        tags: ['Admin'],
        parameters: [{ in: 'query', name: 'status', schema: { type: 'string', enum: ['pending', 'under_review', 'approved', 'rejected'] } }],
        responses: { '200': { description: 'List of schools' } },
      },
    },
    '/admin/schools/{id}/approve': {
      put: {
        summary: 'Approve a school registration',
        tags: ['Admin'],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'School approved' }, '404': { description: 'School not found' } },
      },
    },
    '/admin/schools/{id}/reject': {
      put: {
        summary: 'Reject a school registration',
        tags: ['Admin'],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'School rejected' }, '404': { description: 'School not found' } },
      },
    },
    '/admin/parents': {
      get: {
        summary: 'List all parent accounts',
        tags: ['Admin'],
        responses: { '200': { description: 'List of parents' } },
      },
    },
    '/admin/loans': {
      get: {
        summary: 'List all loan applications',
        tags: ['Admin'],
        responses: { '200': { description: 'List of loan applications' } },
      },
    },

    '/parents/schools': {
      get: {
        summary: 'Browse approved partner schools',
        tags: ['Parent'],
        security: [],
        parameters: [
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'city',   schema: { type: 'string' } },
          { in: 'query', name: 'state',  schema: { type: 'string' } },
          { in: 'query', name: 'page',   schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit',  schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'Paginated list of partner schools' } },
      },
    },
    '/parents/profile': {
      get: {
        summary: "Get the authenticated parent's profile",
        tags: ['Parent'],
        responses: { '200': { description: 'Parent profile' } },
      },
      put: {
        summary: 'Update parent profile',
        tags: ['Parent'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CompleteProfile' } } } },
        responses: { '200': { description: 'Profile updated' } },
      },
    },
    '/parents/change-password': {
      put: {
        summary: 'Change account password',
        tags: ['Parent'],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['currentPassword', 'newPassword'], properties: { currentPassword: { type: 'string' }, newPassword: { type: 'string', minLength: 8 } } } } } },
        responses: { '200': { description: 'Password changed' }, '400': { description: 'Current password incorrect' } },
      },
    },
    '/parents/kyc': {
      post: {
        summary: 'Submit BVN/NIN for KYC verification',
        tags: ['Parent'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/VerifyKYC' } } } },
        responses: { '200': { description: 'KYC verified' } },
      },
    },
    '/parents/students': {
      get: {
        summary: 'List all students under this parent account',
        tags: ['Parent'],
        responses: { '200': { description: 'List of students' } },
      },
      post: {
        summary: 'Add a new student to the parent account',
        tags: ['Parent'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AddStudent' } } } },
        responses: { '201': { description: 'Student added' } },
      },
    },
    '/parents/students/{id}': {
      get: {
        summary: 'Get a single student by ID',
        tags: ['Parent'],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Student record' }, '404': { description: 'Student not found' } },
      },
      put: {
        summary: 'Update a student record',
        tags: ['Parent'],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AddStudent' } } } },
        responses: { '200': { description: 'Student updated' } },
      },
      delete: {
        summary: 'Delete a student (blocked if active loans exist)',
        tags: ['Parent'],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Student deleted' }, '400': { description: 'Cannot delete — active loans exist' } },
      },
    },
    '/parents/applications': {
      get: {
        summary: 'List all loan applications for this parent',
        tags: ['Parent'],
        responses: { '200': { description: 'List of applications' } },
      },
    },
    '/parents/applications/{id}': {
      get: {
        summary: 'Get a single application with full event timeline',
        tags: ['Parent'],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Application detail' }, '404': { description: 'Not found' } },
      },
    },
    '/parents/school-requests': {
      get: {
        summary: 'List all school requests submitted by this parent',
        tags: ['Parent'],
        responses: { '200': { description: 'List of school requests' } },
      },
      post: {
        summary: 'Request a school to be added as a SkulCredit partner',
        tags: ['Parent'],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['schoolName'], properties: { schoolName: { type: 'string' }, schoolAddress: { type: 'string' }, schoolCity: { type: 'string' }, schoolState: { type: 'string' }, contactPerson: { type: 'string' }, contactPhone: { type: 'string' }, contactEmail: { type: 'string', format: 'email' }, additionalNotes: { type: 'string' } } } } } },
        responses: { '201': { description: 'School request submitted' }, '400': { description: 'Duplicate pending request' } },
      },
    },
    '/parents/dashboard': {
      get: {
        summary: 'Parent dashboard — profile, stats, recent applications, students',
        tags: ['Parent'],
        responses: { '200': { description: 'Dashboard data' } },
      },
    },

    '/schools/profile': {
      get: {
        summary: "Get the authenticated school's profile",
        tags: ['School'],
        responses: { '200': { description: 'School profile' } },
      },
      put: {
        summary: 'Update permitted school profile fields',
        tags: ['School'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CompleteSchoolRegistration' } } } },
        responses: { '200': { description: 'Profile updated' } },
      },
    },
    '/schools/complete-registration': {
      put: {
        summary: 'Submit school information for KYB review',
        tags: ['School'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CompleteSchoolRegistration' } } } },
        responses: { '200': { description: 'Submitted for review' }, '400': { description: 'School already approved' } },
      },
    },
    '/schools/bank-details': {
      put: {
        summary: 'Add or update disbursement bank account',
        tags: ['School'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateBankDetails' } } } },
        responses: { '200': { description: 'Bank details updated' } },
      },
    },
    '/schools/applications': {
      get: {
        summary: 'Get all loan applications submitted for this school',
        tags: ['School'],
        parameters: [
          { in: 'query', name: 'status', schema: { type: 'string', enum: ['pending', 'under_review', 'info_requested', 'school_verification', 'approved', 'rejected', 'disbursed', 'repaid', 'cancelled'] } },
          { in: 'query', name: 'page',   schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit',  schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'Paginated application list' } },
      },
    },
    '/schools/applications/{id}': {
      get: {
        summary: 'Get a single application (student and fee info only)',
        tags: ['School'],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Application detail' }, '404': { description: 'Not found' } },
      },
    },
    '/schools/applications/{id}/verify-enrollment': {
      put: {
        summary: 'Confirm or reject student enrollment and fee amount',
        tags: ['School'],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['action'], properties: { action: { type: 'string', enum: ['confirm', 'reject'] }, confirmedTuitionAmount: { type: 'number' }, note: { type: 'string' } } } } } },
        responses: { '200': { description: 'Enrollment confirmed or rejected' }, '400': { description: 'Application not awaiting school verification' } },
      },
    },
    '/schools/dashboard': {
      get: {
        summary: 'School dashboard with stats and recent applications',
        tags: ['School'],
        responses: { '200': { description: 'Dashboard data' } },
      },
    },

    '/loans/eligibility': {
      post: {
        summary: 'Check loan eligibility for a given amount',
        tags: ['Loans'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CheckEligibility' } } } },
        responses: { '200': { description: 'Eligibility result returned' }, '400': { description: 'KYC not completed' } },
      },
    },
    '/loans/apply': {
      post: {
        summary: 'Submit a school-fee loan application',
        tags: ['Loans'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ApplyLoan' } } } },
        responses: { '201': { description: 'Loan application submitted' }, '400': { description: 'Invalid student record' } },
      },
    },

    '/payments/initialize': {
      post: {
        summary: 'Initialize a Paystack payment transaction',
        tags: ['Payments'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/InitializePayment' } } } },
        responses: { '200': { description: 'Payment initialized — returns authorization_url' } },
      },
    },
    '/payments/verify/{reference}': {
      get: {
        summary: 'Verify a Paystack transaction by reference',
        tags: ['Payments'],
        parameters: [{ in: 'path', name: 'reference', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Transaction verification result' } },
      },
    },

    '/upload/document': {
      post: {
        summary: 'Upload a document (PDF, JPG, PNG — max 5MB)',
        tags: ['Upload'],
        requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' } } } } } },
        responses: { '200': { description: 'Document uploaded — returns Cloudinary URL' }, '400': { description: 'No file provided or invalid format' } },
      },
    },

    '/notifications': {
      get: {
        summary: 'List notifications for the authenticated user',
        tags: ['Notifications'],
        parameters: [
          { in: 'query', name: 'page',  schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'Paginated notifications with unread count' },
        },
      },
    },
    '/notifications/read-all': {
      put: {
        summary: 'Mark all notifications as read',
        tags: ['Notifications'],
        responses: { '200': { description: 'All notifications marked as read' } },
      },
    },
    '/notifications/{id}/read': {
      put: {
        summary: 'Mark a single notification as read',
        tags: ['Notifications'],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Notification marked as read' }, '404': { description: 'Not found' } },
      },
    },
    '/notifications/{id}': {
      delete: {
        summary: 'Delete a notification',
        tags: ['Notifications'],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Notification deleted' }, '404': { description: 'Not found' } },
      },
    },
    '/notifications/device-token': {
      post: {
        summary: 'Register a device FCM token for push notifications',
        tags: ['Notifications'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterDeviceToken' } } } },
        responses: { '200': { description: 'Device token registered' } },
      },
      delete: {
        summary: 'Remove a device FCM token',
        tags: ['Notifications'],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['token'], properties: { token: { type: 'string' } } } } } },
        responses: { '200': { description: 'Device token removed' }, '404': { description: 'Token not found' } },
      },
    },
  },
};

export default swaggerSpec;
