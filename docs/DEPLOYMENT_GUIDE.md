# Production Deployment & Hosting Guide

Comprehensive, step-by-step instructions for deploying the **Library Management System** to production cloud platforms and virtual servers.

---

## Table of Contents
1. [Target Architecture & Topologies](#1-target-architecture--topologies)
2. [Managed MySQL 8.0 Database Provisioning](#2-managed-mysql-80-database-provisioning)
3. [Production Environment Variables Checklist](#3-production-environment-variables-checklist)
4. [Deployment Option A: Railway (Recommended for Simplicity)](#4-deployment-option-a-railway)
5. [Deployment Option B: Render](#5-deployment-option-b-render)
6. [Deployment Option C: Self-Hosted Cloud VPS (AWS EC2 / DigitalOcean)](#6-deployment-option-c-self-hosted-cloud-vps)
7. [Initial Administrator Account Bootstrap](#7-initial-administrator-account-bootstrap)
8. [Post-Deployment Verification & Smoke Testing](#8-post-deployment-verification--smoke-testing)
9. [Backup, Monitoring, and Maintenance](#9-backup-monitoring-and-maintenance)

---

## 1. Target Architecture & Topologies

The Library Management System is packaged as a standard containerized Spring Boot 4.x application running Java 21, communicating over standard TCP with MySQL 8.0.

```
                           +------------------------+
                           |  Internet / API Clients |
                           +-----------+------------+
                                       | HTTPS (Port 443)
                                       v
                           +-----------+------------+
                           |   Cloud Load Balancer  |
                           |   (SSL Termination)    |
                           +-----------+------------+
                                       | HTTP (Port 8080)
                                       v
         +--------------------------------------------------------------+
         |                      Docker Container                        |
         |  +--------------------------------------------------------+  |
         |  | Spring Boot 4.x (Eclipse Temurin 21 JRE)                |  |
         |  | Active Profile: prod                                   |  |
         |  | Connection Pool: HikariCP (20 connections)            |  |
         |  +---------------------------+----------------------------+  |
         +------------------------------|-------------------------------+
                                        | JDBC with SSL
                                        v
         +--------------------------------------------------------------+
         |                    Managed MySQL 8.0                         |
         |  - Database: library_management_db                           |
         |  - Character Set: utf8mb4 / utf8mb4_unicode_ci              |
         |  - Automated Backups Enabled                                |
         +--------------------------------------------------------------+
```

---

## 2. Managed MySQL 8.0 Database Provisioning

Do not run stateful production databases inside non-persistent ephemeral containers without attached block storage. Always use a managed MySQL 8.0 provider:

* **Railway**: Add the official MySQL plugin from the Railway Dashboard.
* **Aiven / PlanetScale**: Create a free or paid MySQL 8.0 instance.
* **AWS RDS**: Launch a `db.t4g.micro` or `db.t4g.small` Multi-AZ MySQL 8.0 instance.

### Mandatory MySQL 8.0 Settings:
* **Character Set**: `utf8mb4`
* **Collation**: `utf8mb4_unicode_ci`
* **Timezone**: UTC (`serverTimezone=UTC`)
* **SSL Requirement**: `requireSSL=true` (or `useSSL=true`)

### JDBC Connection String Format:
```properties
jdbc:mysql://<HOST>:<PORT>/<DATABASE_NAME>?useSSL=true&requireSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=false
```

---

## 3. Production Environment Variables Checklist

Set these environment variables in your cloud hosting provider dashboard:

| Variable | Required? | Example / Default | Description |
| :--- | :---: | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | **Yes** | `prod` | Activates production optimizations (`application-prod.properties`). |
| `SPRING_DATASOURCE_URL` | **Yes** | `jdbc:mysql://host:3306/dbname?useSSL=true` | JDBC connection URL to managed MySQL 8.0. |
| `SPRING_DATASOURCE_USERNAME` | **Yes** | `db_user` | MySQL user with DDL and DML permissions. |
| `SPRING_DATASOURCE_PASSWORD` | **Yes** | `StrongSecretPass123!` | Password for MySQL user. |
| `JWT_SECRET_KEY` | **Yes** | Base64-encoded string | 256-bit secret key for HMAC-SHA256 signing. |
| `JWT_EXPIRATION_MS` | No | `86400000` (24 hours) | Token validity duration in milliseconds. |
| `APP_PORT` | No | `8080` (or `$PORT`) | Port on which the Spring app listens. |
| `APP_MAIL_ENABLED` | No | `true` or `false` | Enables/disables automated email notifications. |
| `SMTP_HOST` | If Mail | `smtp.sendgrid.net` | Production SMTP hostname. |
| `SMTP_PORT` | If Mail | `587` | Production SMTP port (TLS). |
| `SMTP_USERNAME` | If Mail | `apikey` | SMTP account username. |
| `SMTP_PASSWORD` | If Mail | `SG.xxxxxxxx` | SMTP password or API token. |
| `APP_MAIL_FROM` | If Mail | `noreply@yourdomain.com` | Verified sender email address. |

### Generating a Secure 256-Bit JWT Secret:
Run this command in any terminal to generate a cryptographically strong secret:
```bash
# On Linux / macOS / Git Bash:
openssl rand -base64 32

# On Windows PowerShell:
$bytes = New-Object byte[] 32; (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes); [Convert]::ToBase64String($bytes)
```

---

## 4. Deployment Option A: Railway

Railway offers the fastest zero-configuration deployment for Spring Boot + MySQL.

1. **Sign in to Railway**: Visit [railway.app](https://railway.app/) and authenticate with your GitHub account.
2. **Create New Project**: Click **"New Project"** -> **"Provision MySQL"**.
   * Note the internal connection variables generated: `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`.
3. **Add GitHub Repository**: Click **"New Service"** -> **"GitHub Repo"** -> Select your `library-management` repository.
4. **Configure Environment Variables**:
   Under the App Service **Variables** tab, add:
   * `SPRING_PROFILES_ACTIVE`: `prod`
   * `SPRING_DATASOURCE_URL`: `jdbc:mysql://${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/${{MySQL.MYSQLDATABASE}}?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC`
   * `SPRING_DATASOURCE_USERNAME`: `${{MySQL.MYSQLUSER}}`
   * `SPRING_DATASOURCE_PASSWORD`: `${{MySQL.MYSQLPASSWORD}}`
   * `JWT_SECRET_KEY`: *(Paste generated Base64 key)*
   * `APP_MAIL_ENABLED`: `false` (or configure SMTP)
5. **Deploy**: Railway automatically detects the [`Dockerfile`](file:///b:/Spring%20Boot/library-management/Dockerfile) in your repository root, compiles the application via Maven, builds the lightweight Alpine runtime image, and provisions an HTTPS URL (e.g., `https://library-management-production.up.railway.app`).

---

## 5. Deployment Option B: Render

1. **Sign in to Render**: Visit [render.com](https://render.com/).
2. **Create MySQL Database**: Provision a managed MySQL instance or link an external Aiven MySQL database.
3. **Create Web Service**: Click **"New +"** -> **"Web Service"** -> Connect your GitHub repository.
4. **Settings**:
   * **Runtime**: `Docker`
   * **Dockerfile Path**: `./Dockerfile`
   * **Instance Type**: Free or Starter (512MB+ RAM)
5. **Environment Variables**:
   * `SPRING_PROFILES_ACTIVE` = `prod`
   * `SPRING_DATASOURCE_URL` = `jdbc:mysql://<render-mysql-host>:3306/<database>?useSSL=true`
   * `SPRING_DATASOURCE_USERNAME` = `<username>`
   * `SPRING_DATASOURCE_PASSWORD` = `<password>`
   * `JWT_SECRET_KEY` = `<your-jwt-secret>`
   * `APP_MAIL_ENABLED` = `false`
6. Click **"Deploy Web Service"**.

---

## 6. Deployment Option C: Self-Hosted Cloud VPS (AWS EC2 / DigitalOcean)

For full server control using Ubuntu 22.04 / 24.04 LTS:

### Step 1: Install Docker & Docker Compose on the VPS
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### Step 2: Clone Repository & Configure Environment
```bash
git clone https://github.com/<your-username>/library-management.git
cd library-management
cp .env.example .env
nano .env   # Fill in production database passwords, JWT secret, and SMTP settings
```

### Step 3: Launch Containers in Background
```bash
docker compose up -d --build
```

### Step 4: Configure Nginx Reverse Proxy with Let's Encrypt SSL
```nginx
# /etc/nginx/sites-available/library.yourdomain.com
server {
    server_name library.yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Obtain free SSL certificate via Certbot:
```bash
sudo certbot --nginx -d library.yourdomain.com
```

---

## 7. Initial Administrator Account Bootstrap

When launching on a clean production database, default users do not exist yet. Follow these steps to register and promote the first administrator:

1. **Register a User Account**:
   Send a POST request to `/api/auth/register`:
   ```bash
   curl -X POST https://<your-app-domain>/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Super Admin",
       "email": "admin@library.com",
       "password": "StrongAdminPassword123!"
     }'
   ```
   *(By default, users are assigned the `MEMBER` role for security.)*

2. **Promote User to ADMIN Role in MySQL**:
   Connect to your production MySQL database:
   ```sql
   USE library_management_db;

   -- Verify the registered user ID
   SELECT id, name, email, role FROM users WHERE email = 'admin@library.com';

   -- Promote the user to ADMIN
   UPDATE users SET role = 'ADMIN' WHERE email = 'admin@library.com';
   ```

3. **Log in as Administrator**:
   Send a POST request to `/api/auth/login` to obtain your ADMIN JWT token:
   ```bash
   curl -X POST https://<your-app-domain>/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@library.com",
       "password": "StrongAdminPassword123!"
     }'
   ```

---

## 8. Post-Deployment Verification & Smoke Testing

Run this checklist immediately after deployment:

1. **OpenAPI Spec Reachability**:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" https://<your-app-domain>/v3/api-docs
   # Expected response: 200
   ```
2. **Swagger UI Web Access**:
   Open browser at: `https://<your-app-domain>/swagger-ui/index.html`
3. **Public Catalog Access**:
   ```bash
   curl -s https://<your-app-domain>/api/books
   # Expected response: HTTP 200 with JSON { "success": true, "data": { "content": [] } }
   ```
4. **Authorized Administrative Request**:
   ```bash
   curl -s https://<your-app-domain>/api/admin/dashboard/summary \
     -H "Authorization: Bearer <your-admin-jwt-token>"
   # Expected response: HTTP 200 with dashboard KPI metrics
   ```

---

## 9. Backup, Monitoring, and Maintenance

* **Automated Daily Backups**:
  Run a scheduled cron job or utilize cloud provider snapshot backups:
  ```bash
  mysqldump -u <user> -p<password> -h <host> library_management_db | gzip > backup_$(date +%F).sql.gz
  ```
* **Inspecting Application Logs**:
  ```bash
  # In Docker / Docker Compose:
  docker compose logs -f --tail=100 app

  # On VPS file system:
  tail -f logs/library-prod.log
  ```
* **Zero-Downtime Rolling Update**:
  ```bash
  git pull origin main
  docker compose build app
  docker compose up -d --no-deps app
  ```
