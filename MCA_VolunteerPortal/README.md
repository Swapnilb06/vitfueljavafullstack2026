# Volunteer Portal

A web platform that connects volunteers with organizations. Volunteers can browse and apply for opportunities, organizations can post opportunities and manage applications, and admins oversee the whole system.

## Features

- **Volunteers**: browse opportunities, apply, track applications, view attendance, download certificates
- **Organizations**: manage profile, post opportunities, review applications, mark attendance, issue certificates
- **Admins**: manage users, organizations, opportunities and applications
- JWT-based authentication with role-based access (VOLUNTEER, ORGANIZATION, ADMIN)
- PDF certificate generation
- API documentation with Swagger / OpenAPI

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot, Spring Security, Spring Data JPA |
| Database | MySQL |
| Auth | JWT |
| API docs | Springdoc OpenAPI (Swagger) |
| Frontend | Plain HTML, CSS and JavaScript (no frameworks) |

## Project Structure

```
VolunteerPortalJava/
├── backend/     Spring Boot application
├── frontend/    HTML, CSS and JS pages
├── database/    schema.sql
└── README.md
```

## Getting Started

### Prerequisites

- Java 21
- MySQL 8+
- A browser (a simple static server such as VS Code Live Server is recommended for the frontend)

### 1. Set up the database

```sql
CREATE DATABASE volunteer_portal;
```

Then run `database/schema.sql` on that database.

### 2. Configure the backend

Copy the example file and add your own values:

```
backend/src/main/resources/application.properties.example
        -> backend/src/main/resources/application-local.properties
```

Set your MySQL password and a long random `jwt.secret` in `application-local.properties`.
This file is ignored by Git and must never be committed.

Alternatively, set environment variables: `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`.

### 3. Run the backend

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

On Windows use `mvnw.cmd` instead of `./mvnw`.

The API runs at `http://localhost:8080`.

### 4. Run the frontend

Open `frontend/index.html` in your browser, or serve the `frontend/` folder with a static server such as VS Code Live Server.

## User Roles

- **Volunteer** - registers publicly
- **Organization** - registers publicly and is verified by an admin
- **Admin** - created manually in the database (no public admin registration)

## Security Note

Never commit passwords, JWT secrets or other credentials. Use `application-local.properties` or environment variables.