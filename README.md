# Marketing Attribution & Lead Scoring API

A high-performance Node.js microservice designed to ingest, score, and relationally map inbound marketing leads. Built with **Fastify**, **Prisma 7**, and **TypeScript**, this project demonstrates modern backend architecture, strict runtime validation, and atomic database operations.

## 🚀 Technical Highlights

- **High-Performance Routing:** Utilizes **Fastify** for near-zero overhead routing and asynchronous request handling.
- **Prisma 7 Architecture:** Implements the latest **Driver Adapter** pattern using `better-sqlite3` for high-concurrency local data persistence.
- **Schema-First Validation:** Leverages **Zod** to enforce strict runtime boundaries, ensuring data integrity before it reaches the service layer.
- **Atomic Relational Ingestion:** Uses Prisma’s nested write capability to perform **atomic transactions** across `Lead`, `Attribution`, and `LeadScore` tables, preventing orphaned records.
- **Firmographic Scoring Engine:** Implements a decoupled business logic layer to calculate "Marketing Qualified Lead" (MQL) status based on job titles, company size, and behavioral attribution data.
- **Containerized for Production:** Uses a multi-stage Docker build on Alpine Linux, compiling native C++ bindings for SQLite while running as a hardened, non-root user.

## 🛠 Tech Stack

- **Runtime:** Node.js 24 (TypeScript / ESM)
- **Framework:** Fastify
- **ORM:** Prisma 7
- **Database:** SQLite (`better-sqlite3`)
- **Validation:** Zod
- **Containerization:** Docker (Multi-stage Alpine)

## 📁 Project Structure

- `src/server.ts`: API entry point, route definitions, and service orchestration.
- `prisma/schema.prisma`: Relational data model and type definitions.
- `prisma.config.ts`: Prisma 7 configuration and driver adapter settings.
- `Dockerfile`: Production-ready, multi-stage container definition.

## 🚀 Getting Started

### Option A: Running with Docker (Recommended)

The easiest way to test the API is via Docker. The container is configured to automatically initialize the SQLite database and apply schemas on startup.

1. Build the image:

   ```bash
   docker build -t marketing-api .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 marketing-api
   ```
   _The API will now be listening on `http://localhost:3000`._

### Option B: Local Development

**Prerequisites:** Node.js 24+

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Configure your environment:
   - Create a `.env` file and add: `DATABASE_URL="file:./prisma/dev.db"`
3. Initialize the database and generate types:
   ```bash
   npx prisma db push
   ```
4. Start the development server (uses `tsx` for real-time TypeScript execution):
   ```bash
   npm run start
   ```

## 🔌 API Documentation

### POST `/leads`

Ingests a new lead and returns the calculated score and attribution mapping.

**Request Body:**

```json
{
  "email": "director@enterprise.com",
  "firstName": "John",
  "lastName": "Smith",
  "company": "TechCorp",
  "jobTitle": "Director of Engineering",
  "employees": 1200,
  "source": "LinkedIn",
  "campaign": "Q2_ABM_Campaign"
}
```

**Successful Response (201 Created):**

```json
{
  "id": "uuid-string",
  "email": "director@enterprise.com",
  "score": {
    "totalScore": 65,
    "isMql": true
  },
  "attribution": {
    "source": "LinkedIn",
    "campaign": "Q2_ABM_Campaign"
  }
}
```

## 🧠 Architectural Decisions

- **Relational Normalization:** Separated `Attribution` and `LeadScore` from the core `Lead` model to support future A/B testing of scoring algorithms without modifying historical user data.
- **Validation Middleware:** Chose Zod for its seamless TypeScript integration, allowing for a single "Source of Truth" for both API types and runtime validation.
- **Performance:** Opted for `better-sqlite3` to take advantage of its synchronous-access performance profile for localized high-throughput data processing.
- **DevOps & Security:** The Dockerfile explicitly runs as the `node` user to prevent root-level escalation, and utilizes Alpine's `apk` to compile native bindings (`libc6-compat`, `g++`) solely in the builder stage to keep the final image footprint minimal.

---

_Developed as a demonstration of modern Node.js backend engineering and data-driven business logic._
