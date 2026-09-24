import env from "./env";

const publicBaseUrl =
  env.appUrl !== `http://localhost:${env.port}`
    ? env.appUrl
    : "http://localhost"; // default: go through nginx on port 80

const swaggerSpec: Record<string, unknown> = {
  openapi: "3.0.0",
  info: {
    title: "SkulCredit API",
    version: "1.0.0",
    description:
      "School-fee financing platform API. Supports three portals: Parent, School, and Admin.",
    contact: { name: "SkulCredit Engineering" },
  },
  servers: [
    {
      url: `${publicBaseUrl}/api/v1`,
      description: "Default (nginx proxy — use this for Try it out)",
    },
    {
      url: `http://localhost:${env.port}/api/v1`,
      description: `Direct API container (port ${env.port} — only if port-forwarded)`,
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      SuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: { type: "object" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          errors: { type: "array", items: { type: "object" } },
        },
      },
      RegisterParent: {
        type: "object",
        required: ["firstName", "lastName", "email", "password", "phoneNumber"],
        properties: {
          firstName: { type: "string", example: "John" },
          middleName: {
            type: "string",
            example: "Michael",
            description: "Optional",
          },
          lastName: { type: "string", example: "Doe" },
          email: {
            type: "string",
            format: "email",
            example: "parent@example.com",
          },
          phoneNumber: { type: "string", example: "08011111111" },
          password: {
            type: "string",
            format: "password",
            minLength: 8,
            example: "Secret@123",
          },
        },
      },
      RegisterSchool: {
        type: "object",
        required: [
          "schoolName",
          "contactPerson",
          "email",
          "password",
          "phoneNumber",
        ],
        properties: {
          schoolName: { type: "string", example: "Greenwood High School" },
          contactPerson: { type: "string", example: "Jane Principal" },
          email: {
            type: "string",
            format: "email",
            example: "school@example.com",
          },
          phoneNumber: { type: "string", example: "08022222222" },
          password: {
            type: "string",
            format: "password",
            minLength: 8,
            example: "Secret@123",
          },
        },
      },
      Login: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "parent@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "Secret@123",
          },
        },
      },
      RefreshToken: {
        type: "object",
        required: ["token"],
        properties: {
          token: { type: "string", example: "abc123refreshtoken..." },
        },
      },
      SendOtp: {
        type: "object",
        required: ["email"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "parent@example.com",
          },
        },
      },
      VerifyOtp: {
        type: "object",
        required: ["email", "otp"],
        properties: {
          email: { type: "string", format: "email" },
          otp: { type: "string", example: "482910" },
        },
      },
      ForgotPassword: {
        type: "object",
        required: ["email"],
        properties: { email: { type: "string", format: "email" } },
      },
      ResetPassword: {
        type: "object",
        required: ["token", "password"],
        properties: {
          token: { type: "string" },
          password: { type: "string", format: "password" },
        },
      },
      CompleteProfile: {
        type: "object",
        properties: {
          middleName: { type: "string" },
          dob: { type: "string", format: "date", example: "1988-05-14" },
          addressStreet: { type: "string" },
          addressCity: { type: "string" },
          addressState: { type: "string" },
          addressPostalCode: { type: "string" },
          addressCountry: { type: "string" },
        },
      },
      VerifyKYC: {
        type: "object",
        required: ["bvn"],
        properties: {
          bvn: { type: "string", example: "12345678901" },
          nin: { type: "string", example: "98765432109" },
        },
      },
      AddStudent: {
        type: "object",
        required: [
          "firstName",
          "lastName",
          "gradeLevel",
          "tuitionAmount",
          "schoolId",
        ],
        properties: {
          firstName: { type: "string", example: "Amara" },
          lastName: { type: "string", example: "Doe" },
          studentId: { type: "string", example: "GWH/2025/001" },
          gradeLevel: { type: "string", example: "JSS 2" },
          tuitionAmount: { type: "number", example: 250000 },
          schoolId: { type: "string", format: "uuid" },
        },
      },
      CompleteSchoolRegistration: {
        type: "object",
        properties: {
          website: { type: "string" },
          population: { type: "string" },
          addressStreet: { type: "string" },
          addressCity: { type: "string" },
          addressState: { type: "string" },
          addressCountry: { type: "string" },
          documentCac: { type: "string" },
          documentLicense: { type: "string" },
        },
      },
      UpdateBankDetails: {
        type: "object",
        required: ["bankName", "accountName", "accountNumber"],
        properties: {
          bankName: { type: "string", example: "GTBank" },
          accountName: { type: "string", example: "Greenwood High School" },
          accountNumber: { type: "string", example: "0123456789" },
        },
      },
      CheckEligibility: {
        type: "object",
        required: ["amount"],
        properties: { amount: { type: "number", example: 200000 } },
      },
      ApplyLoan: {
        type: "object",
        required: ["studentId", "amount", "tenor"],
        properties: {
          studentId: { type: "string", format: "uuid" },
          amount: { type: "number", example: 200000 },
          tenor: { type: "integer", example: 3 },
        },
      },
      InitializePayment: {
        type: "object",
        required: ["amount"],
        properties: {
          amount: { type: "number", example: 50000 },
          metadata: { type: "object", example: { loanId: "abc123" } },
        },
      },
      RegisterDeviceToken: {
        type: "object",
        required: ["token", "platform"],
        properties: {
          token: { type: "string", example: "fcm_device_token_here" },
          platform: { type: "string", enum: ["ios", "android", "web"] },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  tags: [
    {
      name: "Auth",
      description:
        "Registration, login, token management, email verification, OTP, password recovery",
    },
    {
      name: "Parent",
      description:
        "Parent profile, students, applications, schools (role: parent)",
    },
    {
      name: "School",
      description:
        "School portal — profile, applications, enrollment verification (role: school)",
    },
    {
      name: "Admin",
      description:
        "Full platform management — users, parents, schools, catalog, students, loans, ledgers, offers, disbursements, repayments, documents, school requests, notifications, academic sessions and terms, analytics and projections (role: admin)",
    },
    {
      name: "Loans",
      description: "Loan eligibility check and application (role: parent)",
    },
    {
      name: "Payments",
      description: "Paystack payment initialization and verification",
    },
    { name: "Upload", description: "Document upload to Cloudinary" },
    {
      name: "Notifications",
      description:
        "In-app notifications — list, mark read, device token management",
    },
    { name: "Health", description: "Server health check" },
  ],
  paths: {
    "/health": {
      get: {
        summary: "Server health check",
        tags: ["Health"],
        security: [],
        responses: { "200": { description: "Server is running" } },
      },
    },

    // ── Auth ────────────────────────────────────────────────────────────────

    "/auth/register/parent": {
      post: {
        summary: "Register a new parent account",
        tags: ["Auth"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterParent" },
            },
          },
        },
        responses: {
          "201": { description: "Parent registered. Verification email sent." },
          "400": { description: "Validation error or email already in use" },
        },
      },
    },
    "/auth/register/school": {
      post: {
        summary: "Register a new school account",
        tags: ["Auth"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterSchool" },
            },
          },
        },
        responses: {
          "201": { description: "School registered. Verification email sent." },
          "400": { description: "Validation error or email already in use" },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Login with email and password",
        description:
          "Returns accessToken and refreshToken. Account locks for 15 min after 5 failed attempts.",
        tags: ["Auth"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Login" },
            },
          },
        },
        responses: {
          "200": { description: "Login successful" },
          "401": { description: "Invalid credentials" },
          "429": { description: "Account temporarily locked" },
        },
      },
    },
    "/auth/logout": {
      post: {
        summary: "Logout the authenticated user",
        tags: ["Auth"],
        responses: { "200": { description: "Logout successful" } },
      },
    },
    "/auth/refresh-token": {
      post: {
        summary: "Exchange a refresh token for a new access token",
        tags: ["Auth"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshToken" },
            },
          },
        },
        responses: {
          "200": { description: "New access token issued" },
          "401": { description: "Invalid or expired refresh token" },
        },
      },
    },
    "/auth/verify-email": {
      get: {
        summary: "Confirm email address via the verification link",
        tags: ["Auth"],
        security: [],
        parameters: [
          {
            in: "query",
            name: "token",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Email verified successfully" },
          "400": { description: "Token invalid or expired" },
        },
      },
    },
    "/auth/resend-verification": {
      post: {
        summary: "Resend the email verification link",
        tags: ["Auth"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: { email: { type: "string", format: "email" } },
              },
            },
          },
        },
        responses: { "200": { description: "Verification email sent" } },
      },
    },
    "/auth/forgot-password": {
      post: {
        summary: "Request a password reset link (valid 15 minutes)",
        description:
          "Always returns 200 regardless of whether the email exists — prevents enumeration.",
        tags: ["Auth"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ForgotPassword" },
            },
          },
        },
        responses: {
          "200": { description: "Reset link sent if account exists" },
        },
      },
    },
    "/auth/reset-password": {
      post: {
        summary: "Set a new password using the reset token",
        tags: ["Auth"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResetPassword" },
            },
          },
        },
        responses: {
          "200": { description: "Password reset successfully" },
          "400": { description: "Token invalid or expired" },
        },
      },
    },
    "/auth/send-otp": {
      post: {
        summary: "Send a 6-digit OTP to an email (valid 30 minutes)",
        tags: ["Auth"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SendOtp" },
            },
          },
        },
        responses: { "200": { description: "OTP sent successfully" } },
      },
    },
    "/auth/verify-otp": {
      post: {
        summary: "Verify a previously sent OTP",
        tags: ["Auth"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerifyOtp" },
            },
          },
        },
        responses: {
          "200": { description: "OTP verified successfully" },
          "400": { description: "Invalid or expired OTP" },
        },
      },
    },
    "/auth/admin/create": {
      post: {
        summary: "Create a new admin account (requires existing admin token)",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", format: "password" },
                  phoneNumber: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Admin account created" },
          "403": { description: "Admin role required" },
        },
      },
    },

    "/admin/dashboard": {
      get: {
        summary: "Get admin portfolio overview stats",
        tags: ["Admin"],
        responses: { "200": { description: "Dashboard stats returned" } },
      },
    },
    "/admin/schools": {
      get: {
        summary: "List all partner schools, optionally filtered by status",
        tags: ["Admin"],
        parameters: [
          {
            in: "query",
            name: "status",
            schema: {
              type: "string",
              enum: ["pending", "under_review", "approved", "rejected"],
            },
          },
        ],
        responses: { "200": { description: "List of schools" } },
      },
    },
    "/admin/schools/{id}/approve": {
      put: {
        summary: "Approve a school registration",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": { description: "School approved" },
          "404": { description: "School not found" },
        },
      },
    },
    "/admin/schools/{id}/reject": {
      put: {
        summary: "Reject a school registration",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": { description: "School rejected" },
          "404": { description: "School not found" },
        },
      },
    },

    "/parents/schools": {
      get: {
        summary: "Browse approved partner schools",
        tags: ["Parent"],
        security: [],
        parameters: [
          { in: "query", name: "search", schema: { type: "string" } },
          { in: "query", name: "city", schema: { type: "string" } },
          { in: "query", name: "state", schema: { type: "string" } },
          {
            in: "query",
            name: "page",
            schema: { type: "integer", default: 1 },
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: {
          "200": { description: "Paginated list of partner schools" },
        },
      },
    },
    "/parents/profile": {
      get: {
        summary: "Get the authenticated parent's profile",
        tags: ["Parent"],
        responses: { "200": { description: "Parent profile" } },
      },
      put: {
        summary: "Update parent profile",
        tags: ["Parent"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CompleteProfile" },
            },
          },
        },
        responses: { "200": { description: "Profile updated" } },
      },
    },
    "/parents/change-password": {
      put: {
        summary: "Change account password",
        tags: ["Parent"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["currentPassword", "newPassword"],
                properties: {
                  currentPassword: { type: "string" },
                  newPassword: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Password changed" },
          "400": { description: "Current password incorrect" },
        },
      },
    },
    "/parents/kyc": {
      post: {
        summary: "Submit BVN/NIN for KYC verification",
        tags: ["Parent"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerifyKYC" },
            },
          },
        },
        responses: { "200": { description: "KYC verified" } },
      },
    },
    "/parents/students": {
      get: {
        summary: "List all students under this parent account",
        tags: ["Parent"],
        responses: { "200": { description: "List of students" } },
      },
      post: {
        summary: "Add a new student to the parent account",
        tags: ["Parent"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AddStudent" },
            },
          },
        },
        responses: { "201": { description: "Student added" } },
      },
    },
    "/parents/students/{id}": {
      get: {
        summary: "Get a single student by ID",
        tags: ["Parent"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": { description: "Student record" },
          "404": { description: "Student not found" },
        },
      },
      put: {
        summary: "Update a student record",
        tags: ["Parent"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AddStudent" },
            },
          },
        },
        responses: { "200": { description: "Student updated" } },
      },
      delete: {
        summary: "Delete a student (blocked if active loans exist)",
        tags: ["Parent"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": { description: "Student deleted" },
          "400": { description: "Cannot delete — active loans exist" },
        },
      },
    },
    "/parents/applications": {
      get: {
        summary: "List all loan applications for this parent",
        tags: ["Parent"],
        responses: { "200": { description: "List of applications" } },
      },
    },
    "/parents/applications/{id}": {
      get: {
        summary: "Get a single application with full event timeline",
        tags: ["Parent"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": { description: "Application detail" },
          "404": { description: "Not found" },
        },
      },
    },
    "/parents/school-requests": {
      get: {
        summary: "List all school requests submitted by this parent",
        tags: ["Parent"],
        responses: { "200": { description: "List of school requests" } },
      },
      post: {
        summary: "Request a school to be added as a SkulCredit partner",
        tags: ["Parent"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["schoolName"],
                properties: {
                  schoolName: { type: "string" },
                  schoolAddress: { type: "string" },
                  schoolCity: { type: "string" },
                  schoolState: { type: "string" },
                  contactPerson: { type: "string" },
                  contactPhone: { type: "string" },
                  contactEmail: { type: "string", format: "email" },
                  additionalNotes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "School request submitted" },
          "400": { description: "Duplicate pending request" },
        },
      },
    },
    "/parents/dashboard": {
      get: {
        summary:
          "Parent dashboard — profile, stats, recent applications, students",
        tags: ["Parent"],
        responses: { "200": { description: "Dashboard data" } },
      },
    },

    "/schools/profile": {
      get: {
        summary: "Get the authenticated school's profile",
        tags: ["School"],
        responses: { "200": { description: "School profile" } },
      },
      put: {
        summary: "Update permitted school profile fields",
        tags: ["School"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CompleteSchoolRegistration",
              },
            },
          },
        },
        responses: { "200": { description: "Profile updated" } },
      },
    },
    "/schools/complete-registration": {
      put: {
        summary: "Submit school information for KYB review",
        tags: ["School"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CompleteSchoolRegistration",
              },
            },
          },
        },
        responses: {
          "200": { description: "Submitted for review" },
          "400": { description: "School already approved" },
        },
      },
    },
    "/schools/bank-details": {
      put: {
        summary: "Add or update disbursement bank account",
        tags: ["School"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateBankDetails" },
            },
          },
        },
        responses: { "200": { description: "Bank details updated" } },
      },
    },
    "/schools/applications": {
      get: {
        summary: "Get all loan applications submitted for this school",
        tags: ["School"],
        parameters: [
          {
            in: "query",
            name: "status",
            schema: {
              type: "string",
              enum: [
                "pending",
                "under_review",
                "info_requested",
                "school_verification",
                "approved",
                "rejected",
                "disbursed",
                "repaid",
                "cancelled",
              ],
            },
          },
          {
            in: "query",
            name: "page",
            schema: { type: "integer", default: 1 },
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: { "200": { description: "Paginated application list" } },
      },
    },
    "/schools/applications/{id}": {
      get: {
        summary: "Get a single application (student and fee info only)",
        tags: ["School"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": { description: "Application detail" },
          "404": { description: "Not found" },
        },
      },
    },
    "/schools/applications/{id}/verify-enrollment": {
      put: {
        summary: "Confirm or reject student enrollment and fee amount",
        tags: ["School"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["action"],
                properties: {
                  action: { type: "string", enum: ["confirm", "reject"] },
                  confirmedTuitionAmount: { type: "number" },
                  note: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Enrollment confirmed or rejected" },
          "400": {
            description: "Application not awaiting school verification",
          },
        },
      },
    },
    "/schools/dashboard": {
      get: {
        summary: "School dashboard with stats and recent applications",
        tags: ["School"],
        responses: { "200": { description: "Dashboard data" } },
      },
    },

    "/loans/eligibility": {
      post: {
        summary: "Check loan eligibility for a given amount",
        tags: ["Loans"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CheckEligibility" },
            },
          },
        },
        responses: {
          "200": { description: "Eligibility result returned" },
          "400": { description: "KYC not completed" },
        },
      },
    },
    "/loans/apply": {
      post: {
        summary: "Submit a school-fee loan application",
        tags: ["Loans"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApplyLoan" },
            },
          },
        },
        responses: {
          "201": { description: "Loan application submitted" },
          "400": { description: "Invalid student record" },
        },
      },
    },

    "/payments/initialize": {
      post: {
        summary: "Initialize a Paystack payment transaction",
        tags: ["Payments"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/InitializePayment" },
            },
          },
        },
        responses: {
          "200": {
            description: "Payment initialized — returns authorization_url",
          },
        },
      },
    },
    "/payments/verify/{reference}": {
      get: {
        summary: "Verify a Paystack transaction by reference",
        tags: ["Payments"],
        parameters: [
          {
            in: "path",
            name: "reference",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Transaction verification result" },
        },
      },
    },

    "/upload/document": {
      post: {
        summary: "Upload a document (PDF, JPG, PNG — max 5MB)",
        tags: ["Upload"],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: { file: { type: "string", format: "binary" } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Document uploaded — returns Cloudinary URL" },
          "400": { description: "No file provided or invalid format" },
        },
      },
    },

    "/notifications": {
      get: {
        summary: "List notifications for the authenticated user",
        tags: ["Notifications"],
        parameters: [
          {
            in: "query",
            name: "page",
            schema: { type: "integer", default: 1 },
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: {
          "200": { description: "Paginated notifications with unread count" },
        },
      },
    },
    "/notifications/read-all": {
      put: {
        summary: "Mark all notifications as read",
        tags: ["Notifications"],
        responses: {
          "200": { description: "All notifications marked as read" },
        },
      },
    },
    "/notifications/{id}/read": {
      put: {
        summary: "Mark a single notification as read",
        tags: ["Notifications"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": { description: "Notification marked as read" },
          "404": { description: "Not found" },
        },
      },
    },
    "/notifications/{id}": {
      delete: {
        summary: "Delete a notification",
        tags: ["Notifications"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": { description: "Notification deleted" },
          "404": { description: "Not found" },
        },
      },
    },
    "/notifications/device-token": {
      post: {
        summary: "Register a device FCM token for push notifications",
        tags: ["Notifications"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterDeviceToken" },
            },
          },
        },
        responses: { "200": { description: "Device token registered" } },
      },
      delete: {
        summary: "Remove a device FCM token",
        tags: ["Notifications"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token"],
                properties: { token: { type: "string" } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Device token removed" },
          "404": { description: "Token not found" },
        },
      },
    },

    "/admin/analytics/applications": {
      get: {
        summary: "Application stats grouped by day/month/year",
        tags: ["Admin"],
        parameters: [
          {
            in: "query",
            name: "period",
            schema: {
              type: "string",
              enum: ["today", "week", "month", "quarter", "year", "all"],
            },
          },
          {
            in: "query",
            name: "groupBy",
            schema: {
              type: "string",
              enum: ["day", "month", "year"],
              default: "month",
            },
          },
        ],
        responses: { "200": { description: "Application stats time-series" } },
      },
    },
    "/admin/analytics/revenue": {
      get: {
        summary: "Revenue stats grouped by day/month/year",
        tags: ["Admin"],
        parameters: [
          {
            in: "query",
            name: "period",
            schema: {
              type: "string",
              enum: ["today", "week", "month", "quarter", "year", "all"],
            },
          },
          {
            in: "query",
            name: "groupBy",
            schema: {
              type: "string",
              enum: ["day", "month", "year"],
              default: "month",
            },
          },
        ],
        responses: { "200": { description: "Revenue stats time-series" } },
      },
    },
    "/admin/analytics/market-projection": {
      get: {
        summary:
          "Market projection — potential students and revenue from non-registered schools",
        tags: ["Admin"],
        responses: { "200": { description: "Market projection data" } },
      },
    },

    "/admin/users": {
      get: {
        summary: "List all users (any role)",
        tags: ["Admin"],
        parameters: [
          {
            in: "query",
            name: "role",
            schema: { type: "string", enum: ["parent", "school", "admin"] },
          },
          { in: "query", name: "search", schema: { type: "string" } },
        ],
        responses: { "200": { description: "List of users" } },
      },
    },
    "/admin/users/{id}": {
      get: {
        summary: "Get a single user by ID",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": { description: "User record" },
          "404": { description: "Not found" },
        },
      },
    },
    "/admin/users/{id}/toggle-active": {
      patch: {
        summary: "Enable or disable a user account",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["isActive"],
                properties: { isActive: { type: "boolean" } },
              },
            },
          },
        },
        responses: { "200": { description: "User status updated" } },
      },
    },
    "/admin/users/{id}/email": {
      patch: {
        summary: "Reset a user's email address",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: { email: { type: "string", format: "email" } },
              },
            },
          },
        },
        responses: { "200": { description: "Email updated" } },
      },
    },

    "/admin/parents": {
      get: {
        summary: "List all parents with pagination and filters",
        tags: ["Admin"],
        parameters: [
          { in: "query", name: "search", schema: { type: "string" } },
          {
            in: "query",
            name: "kycStatus",
            schema: {
              type: "string",
              enum: ["pending", "submitted", "approved", "rejected"],
            },
          },
          {
            in: "query",
            name: "page",
            schema: { type: "integer", default: 1 },
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: { "200": { description: "Paginated parent list" } },
      },
    },
    "/admin/parents/{id}": {
      get: {
        summary:
          "Get full parent profile with students, applications and documents",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Parent detail" } },
      },
    },
    "/admin/parents/{id}/kyc": {
      patch: {
        summary: "Update parent KYC status",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["kycStatus"],
                properties: {
                  kycStatus: {
                    type: "string",
                    enum: ["pending", "submitted", "approved", "rejected"],
                  },
                  adminNote: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "KYC status updated" } },
      },
    },

    "/admin/schools/{id}": {
      get: {
        summary: "Get full partner school detail",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "School detail" } },
      },
    },
    "/admin/schools/{id}/status": {
      patch: {
        summary: "Update school registration status",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["pending", "under_review", "approved", "rejected"],
                  },
                  adminNote: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Status updated" } },
      },
    },

    "/admin/catalog-schools": {
      get: {
        summary: "List all catalog schools (browsable school directory)",
        tags: ["Admin"],
        parameters: [
          { in: "query", name: "search", schema: { type: "string" } },
          { in: "query", name: "isRegistered", schema: { type: "boolean" } },
        ],
        responses: {
          "200": { description: "Catalog school list with bank accounts" },
        },
      },
    },
    "/admin/catalog-schools/{id}": {
      get: {
        summary: "Get catalog school with class levels and bank accounts",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Catalog school detail" } },
      },
      patch: {
        summary: "Update catalog school (name, tier, rate, isActive)",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  tier: { type: "string", enum: ["1+", "1", "2", "3", "4"] },
                  isRegistered: { type: "boolean" },
                  serviceChargeRate: { type: "number", example: 0.15 },
                  isActive: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Catalog school updated" } },
      },
    },
    "/admin/catalog-schools/{schoolId}/tier": {
      patch: {
        summary: "Update school tier and service charge rate",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "schoolId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  tier: { type: "string" },
                  isRegistered: { type: "boolean" },
                  serviceChargeRate: { type: "number" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Tier updated" } },
      },
    },
    "/admin/catalog-schools/{schoolId}/bank-accounts": {
      get: {
        summary: "List bank accounts for a catalog school",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "schoolId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Bank account list" } },
      },
      post: {
        summary: "Add a bank account to a catalog school",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "schoolId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["bankName", "accountNumber", "accountName"],
                properties: {
                  bankName: { type: "string" },
                  accountNumber: { type: "string" },
                  accountName: { type: "string" },
                  bankCode: { type: "string" },
                  isPrimary: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Bank account added" } },
      },
    },
    "/admin/bank-accounts/{id}": {
      put: {
        summary: "Update a school bank account",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  bankName: { type: "string" },
                  accountNumber: { type: "string" },
                  accountName: { type: "string" },
                  bankCode: { type: "string" },
                  isPrimary: { type: "boolean" },
                  isVerified: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Bank account updated" } },
      },
      delete: {
        summary: "Delete a school bank account",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Bank account deleted" } },
      },
    },

    "/admin/institution-types": {
      get: {
        summary: "List all institution types (Nursery, Primary, Secondary…)",
        tags: ["Admin"],
        responses: { "200": { description: "Institution type list" } },
      },
      post: {
        summary: "Create a new institution type",
        tags: ["Admin"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                  sortOrder: { type: "integer" },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Created" } },
      },
    },
    "/admin/institution-types/{id}": {
      put: {
        summary: "Update an institution type",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  sortOrder: { type: "integer" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        summary: "Delete an institution type",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Deleted" } },
      },
    },

    "/admin/class-levels": {
      get: {
        summary:
          "List class levels, optionally filtered by school or institution type",
        tags: ["Admin"],
        parameters: [
          {
            in: "query",
            name: "schoolId",
            schema: { type: "string", format: "uuid" },
          },
          {
            in: "query",
            name: "institutionTypeId",
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Class level list" } },
      },
      post: {
        summary: "Create a new class level entry",
        tags: ["Admin"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["schoolId", "institutionTypeId", "className"],
                properties: {
                  schoolId: { type: "string", format: "uuid" },
                  institutionTypeId: { type: "string", format: "uuid" },
                  className: { type: "string" },
                  subLevelGroup: { type: "string" },
                  sortOrder: { type: "integer" },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Class level created" } },
      },
    },
    "/admin/class-levels/{id}": {
      put: {
        summary: "Update a class level",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  className: { type: "string" },
                  subLevelGroup: { type: "string" },
                  sortOrder: { type: "integer" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        summary: "Delete a class level",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Deleted" } },
      },
    },

    "/admin/students": {
      get: {
        summary: "List all students with optional parent/school filters",
        tags: ["Admin"],
        parameters: [
          {
            in: "query",
            name: "parentId",
            schema: { type: "string", format: "uuid" },
          },
          {
            in: "query",
            name: "schoolId",
            schema: { type: "string", format: "uuid" },
          },
          {
            in: "query",
            name: "page",
            schema: { type: "integer", default: 1 },
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: { "200": { description: "Paginated student list" } },
      },
    },
    "/admin/students/{id}": {
      get: {
        summary: "Get student detail with loan history",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Student detail" } },
      },
      put: {
        summary: "Update student information",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  gradeLevel: { type: "string" },
                  tuitionAmount: { type: "number" },
                  studentId: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        summary: "Delete a student (blocked if active loans exist)",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": { description: "Deleted" },
          "400": { description: "Active loan exists" },
        },
      },
    },

    "/admin/loans": {
      get: {
        summary: "List all loan applications with filters and pagination",
        tags: ["Admin"],
        parameters: [
          {
            in: "query",
            name: "status",
            schema: {
              type: "string",
              enum: [
                "pending",
                "under_review",
                "info_requested",
                "school_verification",
                "approved",
                "rejected",
                "disbursed",
                "repaid",
                "cancelled",
              ],
            },
          },
          {
            in: "query",
            name: "parentId",
            schema: { type: "string", format: "uuid" },
          },
          {
            in: "query",
            name: "studentId",
            schema: { type: "string", format: "uuid" },
          },
          {
            in: "query",
            name: "catalogSchoolId",
            schema: { type: "string", format: "uuid" },
          },
          {
            in: "query",
            name: "fromDate",
            schema: { type: "string", format: "date" },
          },
          {
            in: "query",
            name: "toDate",
            schema: { type: "string", format: "date" },
          },
          {
            in: "query",
            name: "page",
            schema: { type: "integer", default: 1 },
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: {
          "200": { description: "Paginated loan application list" },
        },
      },
    },
    "/admin/loans/{id}": {
      get: {
        summary:
          "Get full loan application detail (ledger, offer, disbursement, schedule, events)",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Loan application detail" } },
      },
    },
    "/admin/loans/{id}/status": {
      patch: {
        summary: "Update loan application status",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string" },
                  rejectionReason: { type: "string" },
                  adminNote: { type: "string" },
                  decidedBy: { type: "string", format: "uuid" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Status updated and event logged" },
        },
      },
    },
    "/admin/loans/{id}/note": {
      patch: {
        summary: "Add or update admin note on a loan application",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["adminNote"],
                properties: { adminNote: { type: "string" } },
              },
            },
          },
        },
        responses: { "200": { description: "Note updated" } },
      },
    },
    "/admin/loans/{id}/events": {
      get: {
        summary: "Get audit event log for a loan application",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": { description: "Event list in chronological order" },
        },
      },
      post: {
        summary: "Manually create an audit event on a loan application",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["actor", "status"],
                properties: {
                  actor: {
                    type: "string",
                    enum: ["admin", "system", "parent", "school"],
                  },
                  actorId: { type: "string", format: "uuid" },
                  status: { type: "string" },
                  note: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Event created" } },
      },
    },
    "/admin/loans/{id}/schedule": {
      get: {
        summary: "Get repayment schedule for a loan application",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": { description: "Repayment schedule installments" },
        },
      },
    },

    "/admin/ledgers": {
      get: {
        summary:
          "List all loan ledgers (Lendsqr booking state machine records)",
        tags: ["Admin"],
        parameters: [
          { in: "query", name: "status", schema: { type: "string" } },
          {
            in: "query",
            name: "page",
            schema: { type: "integer", default: 1 },
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: { "200": { description: "Paginated ledger list" } },
      },
    },
    "/admin/ledgers/loan/{loanApplicationId}": {
      get: {
        summary: "Get the ledger for a specific loan application",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "loanApplicationId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Loan ledger" } },
      },
    },

    "/admin/loan-offers": {
      get: {
        summary: "List all loan offers",
        tags: ["Admin"],
        parameters: [
          {
            in: "query",
            name: "status",
            schema: {
              type: "string",
              enum: ["pending", "accepted", "declined", "expired"],
            },
          },
          {
            in: "query",
            name: "page",
            schema: { type: "integer", default: 1 },
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: { "200": { description: "Paginated offer list" } },
      },
    },
    "/admin/loan-offers/loan/{loanApplicationId}": {
      get: {
        summary: "Get the loan offer for a specific application",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "loanApplicationId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Loan offer" } },
      },
    },
    "/admin/loan-offers/{id}/status": {
      patch: {
        summary: "Update loan offer status (accept/decline/expire)",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["pending", "accepted", "declined", "expired"],
                  },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Offer status updated" } },
      },
    },

    "/admin/disbursements": {
      get: {
        summary: "List disbursements with filters",
        tags: ["Admin"],
        parameters: [
          {
            in: "query",
            name: "status",
            schema: {
              type: "string",
              enum: [
                "pending",
                "processing",
                "successful",
                "failed",
                "reversed",
              ],
            },
          },
          {
            in: "query",
            name: "schoolId",
            schema: { type: "string", format: "uuid" },
          },
          {
            in: "query",
            name: "fromDate",
            schema: { type: "string", format: "date" },
          },
          {
            in: "query",
            name: "toDate",
            schema: { type: "string", format: "date" },
          },
          {
            in: "query",
            name: "page",
            schema: { type: "integer", default: 1 },
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: { "200": { description: "Paginated disbursement list" } },
      },
    },
    "/admin/disbursements/{id}": {
      get: {
        summary: "Get disbursement detail",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Disbursement detail" } },
      },
    },
    "/admin/disbursements/{id}/status": {
      patch: {
        summary:
          "Update disbursement status (processing/successful/failed/reversed)",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string" },
                  paystackTransferCode: { type: "string" },
                  paystackTransferId: { type: "string" },
                  paystackReference: { type: "string" },
                  failureReason: { type: "string" },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Status updated" } },
      },
    },

    "/admin/repayments": {
      get: {
        summary: "List repayment records with filters",
        tags: ["Admin"],
        parameters: [
          {
            in: "query",
            name: "loanApplicationId",
            schema: { type: "string", format: "uuid" },
          },
          {
            in: "query",
            name: "parentId",
            schema: { type: "string", format: "uuid" },
          },
          {
            in: "query",
            name: "status",
            schema: {
              type: "string",
              enum: ["pending", "successful", "failed", "reversed"],
            },
          },
          {
            in: "query",
            name: "fromDate",
            schema: { type: "string", format: "date" },
          },
          {
            in: "query",
            name: "toDate",
            schema: { type: "string", format: "date" },
          },
          {
            in: "query",
            name: "page",
            schema: { type: "integer", default: 1 },
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: { "200": { description: "Paginated repayment list" } },
      },
    },
    "/admin/repayments/manual": {
      post: {
        summary: "Record a manual repayment transaction",
        tags: ["Admin"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "loanApplicationId",
                  "parentId",
                  "amount",
                  "paymentMethod",
                  "type",
                ],
                properties: {
                  loanApplicationId: { type: "string", format: "uuid" },
                  parentId: { type: "string", format: "uuid" },
                  amount: { type: "number" },
                  paymentMethod: {
                    type: "string",
                    enum: [
                      "card",
                      "bank_transfer",
                      "direct_debit",
                      "ussd",
                      "manual",
                    ],
                  },
                  type: {
                    type: "string",
                    enum: [
                      "scheduled",
                      "early_partial",
                      "early_full",
                      "late",
                      "manual_reversal",
                    ],
                  },
                  paidAt: { type: "string", format: "date-time" },
                  notes: { type: "string" },
                  receiptNumber: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Manual repayment recorded" } },
      },
    },
    "/admin/repayments/{id}": {
      get: {
        summary: "Get repayment detail",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Repayment detail" } },
      },
    },
    "/admin/schedule/{id}": {
      patch: {
        summary: "Update a repayment schedule installment",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                    enum: [
                      "upcoming",
                      "due",
                      "paid",
                      "partially_paid",
                      "overdue",
                      "waived",
                    ],
                  },
                  amountPaid: { type: "number" },
                  paidAt: { type: "string", format: "date-time" },
                  lateFeeApplied: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Installment updated" } },
      },
    },

    "/admin/documents": {
      get: {
        summary: "List KYC documents",
        tags: ["Admin"],
        parameters: [
          {
            in: "query",
            name: "parentId",
            schema: { type: "string", format: "uuid" },
          },
          {
            in: "query",
            name: "category",
            schema: { type: "string", enum: ["photo", "kyc_document"] },
          },
          {
            in: "query",
            name: "page",
            schema: { type: "integer", default: 1 },
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: { "200": { description: "Document list" } },
      },
    },
    "/admin/documents/{id}": {
      get: {
        summary: "Get a single KYC document",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Document detail" } },
      },
      delete: {
        summary: "Delete a KYC document",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Deleted" } },
      },
    },

    "/admin/school-requests": {
      get: {
        summary: "List school onboarding requests from parents",
        tags: ["Admin"],
        parameters: [
          {
            in: "query",
            name: "status",
            schema: {
              type: "string",
              enum: ["pending", "in_progress", "onboarded", "rejected"],
            },
          },
          {
            in: "query",
            name: "page",
            schema: { type: "integer", default: 1 },
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: { "200": { description: "Paginated school request list" } },
      },
    },
    "/admin/school-requests/{id}": {
      get: {
        summary: "Get a single school request",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "School request detail" } },
      },
    },
    "/admin/school-requests/{id}/status": {
      patch: {
        summary: "Update school request status and add admin note",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["pending", "in_progress", "onboarded", "rejected"],
                  },
                  adminNote: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Status updated" } },
      },
    },

    "/admin/notifications": {
      get: {
        summary: "List in-app notifications for all users (admin view)",
        tags: ["Admin"],
        parameters: [
          {
            in: "query",
            name: "userId",
            schema: { type: "string", format: "uuid" },
          },
          { in: "query", name: "isRead", schema: { type: "boolean" } },
          {
            in: "query",
            name: "page",
            schema: { type: "integer", default: 1 },
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: { "200": { description: "Paginated notification list" } },
      },
    },
    "/admin/notifications/broadcast": {
      post: {
        summary:
          "Broadcast a notification to users (all, by role, or specific IDs)",
        tags: ["Admin"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "message", "type"],
                properties: {
                  userIds: {
                    type: "array",
                    items: { type: "string", format: "uuid" },
                  },
                  role: { type: "string", enum: ["parent", "school"] },
                  title: { type: "string" },
                  message: { type: "string" },
                  type: { type: "string" },
                  referenceId: { type: "string", format: "uuid" },
                  referenceType: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Notification sent — returns count of recipients",
          },
        },
      },
    },
    "/admin/notifications/{id}": {
      delete: {
        summary: "Delete a notification record",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Deleted" } },
      },
    },

    "/admin/device-tokens": {
      get: {
        summary: "List device tokens for push notifications",
        tags: ["Admin"],
        parameters: [
          {
            in: "query",
            name: "userId",
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Device token list" } },
      },
    },
    "/admin/device-tokens/{id}": {
      delete: {
        summary: "Delete a device token",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Deleted" } },
      },
    },

    "/admin/sessions": {
      get: {
        summary: "List all academic sessions with nested terms",
        tags: ["Admin"],
        responses: { "200": { description: "Session list" } },
      },
      post: {
        summary: "Create a new academic session",
        tags: ["Admin"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["sessionName", "startYear", "endYear"],
                properties: {
                  sessionName: { type: "string", example: "2026/2027" },
                  startYear: { type: "integer" },
                  endYear: { type: "integer" },
                  isCurrent: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Session created" } },
      },
    },
    "/admin/sessions/{id}": {
      get: {
        summary: "Get a single academic session with nested terms",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Session detail" } },
      },
      put: {
        summary: "Update academic session metadata",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  sessionName: { type: "string" },
                  isCurrent: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        summary: "Delete a session (cascades to all its terms)",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Deleted" } },
      },
    },
    "/admin/sessions/{id}/current": {
      put: {
        summary: "Mark a session as current (unsets all others)",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Session set as current" } },
      },
    },
    "/admin/sessions/{sessionId}/terms": {
      post: {
        summary: "Create a term inside a session",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "sessionId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "termCode",
                  "termName",
                  "defaultResumptionMonth",
                  "maxRepaymentMonths",
                ],
                properties: {
                  termCode: {
                    type: "string",
                    enum: ["FIRST_TERM", "SECOND_TERM", "THIRD_TERM"],
                  },
                  termName: { type: "string" },
                  defaultResumptionMonth: { type: "string" },
                  maxRepaymentMonths: { type: "integer" },
                  resumptionDate: { type: "string", format: "date" },
                  portalOpeningDate: { type: "string", format: "date" },
                  portalCloseDate: { type: "string", format: "date" },
                  status: { type: "string" },
                  applicationWindows: { type: "array" },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Term created" } },
      },
    },

    "/admin/terms": {
      get: {
        summary: "List academic terms, optionally filtered by session",
        tags: ["Admin"],
        parameters: [
          {
            in: "query",
            name: "sessionId",
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Term list" } },
      },
    },
    "/admin/terms/{id}": {
      get: {
        summary: "Get a single academic term",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Term detail" } },
      },
      put: {
        summary: "Update term dates, windows, or status",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  portalOpeningDate: { type: "string", format: "date" },
                  portalCloseDate: { type: "string", format: "date" },
                  maxRepaymentMonths: { type: "integer" },
                  status: { type: "string" },
                  applicationWindows: { type: "array" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        summary: "Delete an academic term",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Deleted" } },
      },
    },
    "/admin/terms/{id}/activate": {
      put: {
        summary: "Activate a term (closes all other active terms)",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Term activated" } },
      },
    },

    "/admin/school-terms": {
      get: {
        summary: "List legacy per-school terms created by school accounts",
        tags: ["Admin"],
        parameters: [
          {
            in: "query",
            name: "schoolId",
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "School term list" } },
      },
    },
    "/admin/school-terms/{id}": {
      get: {
        summary: "Get a legacy school term",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Term detail" } },
      },
      delete: {
        summary: "Delete a legacy school term",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Deleted" } },
      },
    },

    "/admin/current-term": {
      get: {
        summary:
          "Get the currently active academic term with portal window and effective tenor",
        tags: ["Admin"],
        responses: {
          "200": { description: "Active term details or isOpen:false if none" },
        },
      },
    },

    "/admin/parents/{parentId}/eligibility-status": {
      get: {
        summary:
          "Get a parent's eligibility status (KYC state, block flag, blockedUntil)",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "parentId",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "The parent's userId",
          },
        ],
        responses: {
          "200": { description: "Eligibility status" },
          "404": { description: "Parent not found" },
        },
      },
    },

    "/admin/parents/{parentId}/eligibility-profile": {
      get: {
        summary: "Get a parent's full eligibility profile",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "parentId",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "The parent's userId",
          },
        ],
        responses: {
          "200": { description: "Eligibility profile" },
          "404": { description: "Parent not found" },
        },
      },
      patch: {
        summary: "Update a parent's eligibility profile fields",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "parentId",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "The parent's userId",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  photoUrl: { type: "string" },
                  phoneNumber: { type: "string" },
                  employerType: { type: "string" },
                  yearsInRole: { type: "string" },
                  monthlyIncome: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Profile updated" },
          "404": { description: "Parent not found" },
        },
      },
    },

    "/admin/parents/{parentId}/score-check": {
      post: {
        summary:
          "Manually trigger a BVN karma / credit score check for a parent",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "parentId",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "The parent's userId",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["bvn"],
                properties: {
                  bvn: { type: "string", example: "12345678901" },
                  requestedAmount: { type: "number", example: 100 },
                  location: { type: "string", example: "Lagos" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description:
              "Score check result (pass, decision, creditScore, advisoryAmount)",
          },
          "400": { description: "Invalid BVN" },
          "404": { description: "Parent not found" },
        },
      },
    },

    "/admin/parents/{parentId}/loans/{loanId}/mandate-preview": {
      get: {
        summary: "Get the repayment mandate preview for a loan application",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "parentId",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "The parent's userId",
          },
          {
            in: "path",
            name: "loanId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            in: "query",
            name: "debitDay",
            schema: { type: "integer", example: 1 },
            description: "Day of month (1–28) for installment debit",
          },
        ],
        responses: {
          "200": { description: "Mandate preview with installment schedule" },
          "404": { description: "Application not found" },
        },
      },
    },

    "/admin/parents/{parentId}/loans/{loanId}/confirm-service-charge": {
      post: {
        summary: "Manually mark service charge as paid for a loan application",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "parentId",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "The parent's userId",
          },
          {
            in: "path",
            name: "loanId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  paystackReference: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Service charge confirmed" },
          "404": { description: "Application not found" },
        },
      },
    },

    "/admin/parents/{parentId}/loans/{loanId}/setup-repayment": {
      post: {
        summary:
          "Trigger repayment schedule creation and funding partner handoff for a loan",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "parentId",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "The parent's userId",
          },
          {
            in: "path",
            name: "loanId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  debitDay: {
                    type: "integer",
                    example: 1,
                    description: "Day of month for debit (1–28)",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description:
              "Repayment schedule created and funding partner notified",
          },
          "400": {
            description: "Service charge not paid or invalid application state",
          },
          "409": { description: "Repayment schedule already exists" },
          "404": { description: "Application not found" },
        },
      },
    },

    "/admin/parents/{parentId}/loans/{loanId}/pay-installment": {
      post: {
        summary: "Record a repayment installment on behalf of a parent",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "parentId",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "The parent's userId",
          },
          {
            in: "path",
            name: "loanId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["paystackReference", "scheduleIds"],
                properties: {
                  paystackReference: { type: "string" },
                  scheduleIds: {
                    type: "array",
                    items: { type: "string", format: "uuid" },
                  },
                  type: {
                    type: "string",
                    enum: ["scheduled", "early_partial", "early_full"],
                    default: "scheduled",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Repayment recorded" },
          "400": { description: "Missing required fields" },
          "404": { description: "Application not found" },
        },
      },
    },

    "/admin/schools/user/{schoolUserId}/dashboard": {
      get: {
        summary: "Get a school's dashboard stats (via the school's userId)",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "schoolUserId",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "The school account's userId",
          },
        ],
        responses: {
          "200": {
            description: "School dashboard stats and recent applications",
          },
          "404": { description: "School not found" },
        },
      },
    },

    "/admin/schools/user/{schoolUserId}/loans/{loanId}/verify-enrollment": {
      put: {
        summary: "Confirm or reject student enrollment on behalf of a school",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "schoolUserId",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "The school account's userId",
          },
          {
            in: "path",
            name: "loanId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["action"],
                properties: {
                  action: { type: "string", enum: ["confirm", "reject"] },
                  confirmedTuitionAmount: { type: "number" },
                  note: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Enrollment confirmed or rejected" },
          "400": { description: "Application not in a verifiable state" },
          "404": { description: "Application or school not found" },
        },
      },
    },

    "/admin/users/{userId}/notifications": {
      get: {
        summary: "List all notifications for a specific user",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "userId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            in: "query",
            name: "page",
            schema: { type: "integer", default: 1 },
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: {
          "200": { description: "Paginated notifications with unread count" },
        },
      },
    },

    "/admin/users/{userId}/notifications/read-all": {
      put: {
        summary: "Mark all notifications as read for a specific user",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "userId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": { description: "All notifications marked as read" },
        },
      },
    },

    "/admin/users/{userId}/notifications/{notificationId}/read": {
      put: {
        summary: "Mark a single notification as read for a specific user",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "userId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            in: "path",
            name: "notificationId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": { description: "Notification marked as read" },
          "404": { description: "Notification not found" },
        },
      },
    },

    "/admin/users/{userId}/notifications/{notificationId}/reply": {
      post: {
        summary: "Send a reply notification to a user",
        tags: ["Admin"],
        parameters: [
          {
            in: "path",
            name: "userId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            in: "path",
            name: "notificationId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["message"],
                properties: {
                  message: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Reply notification sent" },
          "400": { description: "message is required" },
          "404": { description: "Original notification not found" },
        },
      },
    },
  },
};

export default swaggerSpec;
