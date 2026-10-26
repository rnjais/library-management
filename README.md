# Library Management System - Enterprise REST API

[![Java 21](https://img.shields.io/badge/Java-21-orange.svg?logo=openjdk)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.2-brightgreen.svg?logo=springboot)](https://spring.io/projects/spring-boot)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg?logo=mysql)](https://www.mysql.com/)
[![Spring Security](https://img.shields.io/badge/Spring%20Security-JWT-green.svg?logo=springsecurity)](https://spring.io/projects/spring-security)
[![Tests](https://img.shields.io/badge/Tests-163%20Passing-success.svg?logo=junit5)](https://junit.org/junit5/)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0%20%2F%20Swagger%20UI-green.svg?logo=swagger)](http://localhost:8080/swagger-ui/index.html)
[![Docker](https://img.shields.io/badge/Docker-Multi--Stage-blue.svg?logo=docker)](https://www.docker.com/)

A comprehensive, production-ready enterprise RESTful API for modern Library Management built with **Java 21**, **Spring Boot 4.1.2**, and **MySQL 8.0**.

The application provides end-to-end features for book cataloging, member administration, transactional book loan lifecycles with real-time inventory synchronization, automated overdue fine calculation, stateless JWT authentication with Role-Based Access Control (RBAC), event-driven HTML email notifications, scheduled due-date reminders, interactive Swagger UI documentation, a test suite of 163 unit and integration tests, multi-stage Dockerization, and production profiles.

---

## Table of Contents
- [Architecture & Design Principles](#architecture--design-principles)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [REST API Endpoints](#rest-api-endpoints)
- [Local Setup & Getting Started](#local-setup--getting-started)
- [Docker & Docker Compose](#docker--docker-compose)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Example cURL Workflows](#example-curl-workflows)
- [Production Deployment](#production-deployment)
- [Project Structure](#project-structure)

---

## Architecture & Design Principles

The application adheres to clean architecture principles and separation of concerns:

```
[ HTTP Client / Swagger UI / Web Frontend ]
                     |
                     v (HTTPS / REST)
       [ SecurityFilterChain (JWT Auth Filter) ]
                     |
                     v
             [ REST Controllers ]
                     |
                     v (DTOs / Validation)
             [ Service Layer ] <-----------> [ Spring Application Events ]
                     |                                     |
                     v                                     v
       [ Spring Data JPA Repositories ]         [ Async Event Listeners ]
                     |                                     |
                     v                                     v
           [ MySQL 8.0 Database ]               [ JavaMailSender / SMTP ]
```

### Key Architectural Patterns:
* **Stateless JWT Security**: Requests carry standard `Authorization: Bearer <token>` headers authenticated against stateless `JwtAuthenticationFilter` with BCrypt password hashing.
* **Role-Based Access Control (RBAC)**: Fine-grained method and URL authorization differentiating between `ROLE_ADMIN` and `ROLE_MEMBER`.
* **Transactional Integrity**: All multi-step inventory adjustments, loan status updates, and fine calculations execute within `@Transactional` boundaries with atomic rollbacks on exception.
* **Event-Driven Architecture**: Decoupled email dispatches via Spring's `ApplicationEventMulticaster` and `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`, ensuring emails are dispatched only after database transactions commit successfully.
* **Unified API Response Schema**: Consistent JSON envelopes across the entire API (`ApiResponse<T>` and `ErrorResponse`) with standardized timestamps, HTTP statuses, and field-level validation messages.
* **Isolated Integration Testing**: Full test suite hitting a dedicated test database (`library_test_db`) without mutating development or production data.

---

## Key Features

### 1. Book Catalog Management
* Full CRUD endpoints for books with title, author, ISBN, category, total copies, and available copies.
* Multi-criteria filtering by title keyword and category with pagination (`page`, `size`) and dynamic multi-field sorting (`sortBy`, `direction`).
* Inventory protection: Books with active borrowings cannot be deleted.

### 2. Member Administration
* Member registration with unique email constraints, phone number, and address validation.
* Active status toggle (soft deactivation) preventing borrowing when accounts are deactivated.
* Configurable active borrowing limits per member (default max 5 books).

### 3. Transactional Book Borrowing & Returning
* Issues loans with automatic inventory deduction (`availableCopies - 1`).
* Prevents borrowing when inventory is exhausted or when a member already holds an active loan for the same book.
* Returning books restores available inventory (`availableCopies + 1`), sets return date, and triggers overdue evaluation.

### 4. Overdue Fine Assessment & Payment Lifecycle
* Automatic fine generation upon return of overdue books based on configurable daily fine rates (`₹5.00 / day`).
* Unpaid balance tracking per member with total amounts and counts.
* Payment processing endpoint transitioning fine records to `PAID` with transaction tracking.

### 5. Role-Based Access Control & Security
* User registration and login issuing signed HMAC-SHA256 JWT tokens.
* Public catalog viewing; member self-service for personal loans and fines; administrator-only access for book creation, member management, and reports.
* Custom `JwtAuthenticationEntryPoint` and `JwtAccessDeniedHandler` returning clean JSON error responses for 401 Unauthorized and 403 Forbidden.

### 6. Analytics Dashboard & Administrative Reports
* Real-time dashboard KPI metrics: total titles, total copies, active loans, overdue loans, registered members, and collected/unpaid fine revenues.
* Comprehensive reports with pagination and date range filtering:
  * Book inventory report by category
  * Member patronage and registration report
  * Loan circulation report
  * Overdue loan report
  * Fine financial assessment report

### 7. Event-Driven Email Notifications & Schedulers
* Automated HTML email dispatches upon:
  * Book borrowed (with loan details and return due date)
  * Book returned (with confirmation and fine status)
  * Fine assessed (with overdue breakdown)
  * Fine paid (with payment confirmation)
* Scheduled daily cron job (`DueDateReminderScheduler`) notifying members whose loans are due within 2 days, with database-backed tracking (`BorrowingReminder`) preventing duplicate notifications.

### 8. Interactive API Documentation
* Full OpenAPI 3.0 specification generated dynamically via **Springdoc OpenAPI**.
* Swagger UI with built-in JWT Bearer **"Authorize"** button for interactive API exploration.

---

## Technology Stack

| Layer / Component | Technology | Version |
| :--- | :--- | :--- |
| **Language** | Java (OpenJDK) | 21 |
| **Framework** | Spring Boot | 4.1.2 |
| **Database** | MySQL | 8.0 |
| **ORM / Data Access** | Spring Data JPA / Hibernate | 7.x |
| **Connection Pool** | HikariCP | 6.x |
| **Security** | Spring Security & JJWT (Java JWT) | 0.12.6 |
| **Validation** | Jakarta Bean Validation (Hibernate Validator) | 3.x |
| **Email Service** | Spring Boot Starter Mail (JavaMailSender) | 4.1.2 |
| **API Documentation** | Springdoc OpenAPI Starter WebMVC UI (Swagger UI) | 2.8.5 |
| **Testing** | JUnit 5, Mockito, Spring Boot Test, MockMvc | 6.x / 5.x |
| **Boilerplate Reduction**| Project Lombok | Latest |
| **Containerization** | Docker (Multi-stage build) & Docker Compose | Engine 28.x / Compose 2.40+ |

---

## REST API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user account (Default role: `MEMBER`). |
| `POST` | `/api/auth/login` | Public | Authenticate with email/password and obtain JWT token. |

### Books Catalog (`/api/books`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/books` | Public | Retrieve books with pagination, sorting, and search filters. |
| `GET` | `/api/books/{id}` | Public | Retrieve a specific book by ID. |
| `POST` | `/api/books` | `ADMIN` | Add a new book to the library catalog. |
| `PUT` | `/api/books/{id}` | `ADMIN` | Update an existing book's details. |
| `DELETE`| `/api/books/{id}` | `ADMIN` | Delete a book (blocked if copies are currently borrowed). |

### Members Management (`/api/members`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/members` | `ADMIN` | Register a new library member. |
| `GET` | `/api/members` | `ADMIN` | Retrieve all members with pagination and sorting. |
| `GET` | `/api/members/{id}` | `ADMIN` | Retrieve member details by ID. |
| `GET` | `/api/members/search` | `ADMIN` | Search members by first or last name keyword. |
| `GET` | `/api/members/active` | `ADMIN` | Retrieve only active members with pagination. |
| `PUT` | `/api/members/{id}` | `ADMIN` | Update member information. |
| `PATCH`| `/api/members/{id}/deactivate` | `ADMIN` | Soft-deactivate a member account. |

### Borrowings (`/api/borrowings`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/borrowings` | `MEMBER`, `ADMIN` | Borrow a book (decrements inventory). |
| `PATCH`| `/api/borrowings/{id}/return` | `MEMBER`, `ADMIN` | Return a borrowed book (restores inventory, assesses fine). |
| `GET` | `/api/borrowings/{id}` | `MEMBER`, `ADMIN` | Retrieve details of a specific borrowing record. |
| `GET` | `/api/borrowings/member/{memberId}` | `MEMBER`, `ADMIN` | Retrieve borrowing history for a specific member. |
| `GET` | `/api/borrowings` | `ADMIN` | Retrieve all borrowing records with pagination. |
| `GET` | `/api/borrowings/overdue` | `ADMIN` | Retrieve all currently overdue borrowings. |
| `GET` | `/api/borrowings/book/{bookId}` | `ADMIN` | Retrieve borrowing history for a specific book. |

### Fines (`/api/fines`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/fines/{id}` | `MEMBER`, `ADMIN` | Retrieve fine record by ID. |
| `GET` | `/api/fines/member/{memberId}` | `MEMBER`, `ADMIN` | Retrieve all fines for a specific member. |
| `GET` | `/api/fines/member/{memberId}/unpaid-total` | `MEMBER`, `ADMIN` | Get member unpaid fine balance and count. |
| `PATCH`| `/api/fines/{id}/pay` | `MEMBER`, `ADMIN` | Mark an unpaid fine as PAID with payment metadata. |
| `GET` | `/api/fines` | `ADMIN` | Retrieve all fines with pagination. |
| `GET` | `/api/fines/unpaid` | `ADMIN` | Retrieve all currently unpaid fines. |

### Administrator Dashboard & Reports (`/api/admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/admin/dashboard/summary` | `ADMIN` | Retrieve high-level library analytics & KPI cards. |
| `GET` | `/api/admin/reports/books` | `ADMIN` | Book inventory report by category and copy availability. |
| `GET` | `/api/admin/reports/members` | `ADMIN` | Member registration report with status & date filters. |
| `GET` | `/api/admin/reports/borrowings`| `ADMIN` | Circulation report filtered by status and date range. |
| `GET` | `/api/admin/reports/overdue` | `ADMIN` | Currently overdue unreturned loans report. |
| `GET` | `/api/admin/reports/fines` | `ADMIN` | Fine revenue report filtered by status and date range. |

### Documentation & OpenAPI (`/swagger-ui`, `/v3/api-docs`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/swagger-ui/index.html` | Public | Interactive Swagger UI web documentation. |
| `GET` | `/v3/api-docs` | Public | Raw OpenAPI 3.0 JSON specification. |

---

## Local Setup & Getting Started

### Prerequisites
* **Java Development Kit (JDK) 21** or higher.
* **MySQL 8.0** running on `localhost:3306`.
* **Git**.

### 1. Clone Repository
```bash
git clone https://github.com/<your-username>/library-management.git
cd library-management
```

### 2. Configure Database
Start your local MySQL service. The application automatically creates the database if it does not exist.
Verify settings in [`src/main/resources/application.properties`](file:///b:/Spring%20Boot/library-management/src/main/resources/application.properties):
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/library_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=YourLocalPassword
```

### 3. Run Application
Using the included Maven wrapper:
```powershell
# On Windows:
.\mvnw.cmd spring-boot:run

# On Linux / macOS:
./mvnw spring-boot:run
```

Once started, explore the interactive documentation in your browser:
* **Swagger UI**: [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
* **OpenAPI JSON**: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

---

## Docker & Docker Compose

Launch the entire stack (Spring Boot Application + MySQL 8.0) with zero local tool installation:

### 1. Build and Start Services
```bash
docker compose up -d --build
```

### 2. Inspect Live Logs
```bash
docker compose logs -f app
```

### 3. Stop All Containers
```bash
docker compose down
```
*(Database data persists securely in the Docker named volume `library_mysql_data` across restarts.)*

---

## Testing & Quality Assurance

The codebase includes an extensive automated test suite covering unit tests, MockMvc security controller tests, and full MySQL integration tests:

* **151 Unit & MockMvc Tests**: Testing business logic across services, validation constraints, and security authorization rules.
* **12 MySQL Integration Tests**: Testing multi-table transactional borrowings, inventory decrement/increment, overdue fine calculation, and OpenAPI documentation schema endpoints against `library_test_db`.

Run the complete test suite:
```powershell
# On Windows:
.\mvnw.cmd test

# On Linux / macOS:
./mvnw test
```

Expected result:
```text
[INFO] Results:
[INFO] Tests run: 163, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

---

## Example cURL Workflows

### 1. Register a Member
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice.johnson@example.com",
    "password": "Password123!"
  }'
```

### 2. Log In & Obtain JWT Bearer Token
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice.johnson@example.com",
    "password": "Password123!"
  }'
```
Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "tokenType": "Bearer",
    "user": {
      "id": 1,
      "name": "Alice Johnson",
      "email": "alice.johnson@example.com",
      "role": "MEMBER"
    }
  }
}
```

### 3. Browse Books Catalog with Pagination & Filter (Public)
```bash
curl -X GET "http://localhost:8080/api/books?category=Software&page=0&size=10&sortBy=title&direction=ASC"
```

### 4. Borrow a Book
```bash
curl -X POST http://localhost:8080/api/borrowings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "bookId": 1,
    "memberId": 1,
    "borrowDays": 14
  }'
```

### 5. Return a Borrowed Book
```bash
curl -X PATCH http://localhost:8080/api/borrowings/1/return \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### 6. Pay an Overdue Fine
```bash
curl -X PATCH http://localhost:8080/api/fines/1/pay \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "paymentMethod": "UPI",
    "transactionReference": "UPI-TXN-9876543210",
    "notes": "Paid via Google Pay"
  }'
```

### 7. Retrieve Admin Dashboard Summary (Admin Token Required)
```bash
curl -X GET http://localhost:8080/api/admin/dashboard/summary \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```

---

## Production Deployment

For full cloud hosting instructions on **Railway**, **Render**, or self-hosted **AWS EC2 / DigitalOcean VPS**, refer to the detailed [Production Deployment Guide](docs/DEPLOYMENT_GUIDE.md).

Activate the hardened production profile:
```bash
java -jar -Dspring.profiles.active=prod target/library-management-0.0.1-SNAPSHOT.jar
```

---

## Project Structure

```
library-management/
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── pom.xml
├── README.md
├── docs/
│   └── DEPLOYMENT_GUIDE.md
└── src/
    ├── main/
    │   ├── java/com/library_management/
    │   │   ├── config/              # Security, OpenAPI, and properties configurations
    │   │   ├── controller/          # REST API endpoints (Auth, Books, Borrowings, Members, Fines, Admin)
    │   │   ├── dto/                 # Request & Response Data Transfer Objects
    │   │   ├── entity/              # JPA domain entities (Book, Member, Borrowing, Fine, User, Reminder)
    │   │   ├── event/               # Spring Application Events & Listeners
    │   │   ├── exception/           # Custom business exceptions & GlobalExceptionHandler
    │   │   ├── repository/          # Spring Data JPA Repository interfaces
    │   │   ├── scheduler/          # Due-date & overdue fine cron schedulers
    │   │   ├── security/            # JWT Token provider, Auth filter, and entry points
    │   │   └── service/             # Business logic interfaces and implementations
    │   └── resources/
    │       ├── application.properties        # Default / Local development configuration
    │       └── application-prod.properties   # Production-hardened profile configuration
    └── test/
        ├── java/com/library_management/
        │   ├── controller/          # MockMvc web layer tests
        │   ├── integration/         # Full MySQL database integration tests & OpenAPI tests
        │   └── service/             # Mockito unit tests for business services
        └── resources/
            └── application.properties        # Isolated test database configuration
```

---

## License

This project is licensed under the [Apache 2.0 License](LICENSE).
