# MedInsight Microservices 🏥

A comprehensive suite of microservices designed for managing various aspects of a healthcare platform, including patient dossiers, lab orders, prescriptions, and staff management.

This project leverages Spring Boot for microservice development, Docker for containerization, and Kafka for asynchronous communication between services.

## Table of Contents 📑

- [Project Title & Badges](#project-title--badges)
- [Description](#description)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [How to Use](#how-to-use)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)
- [Important Links](#important-links)
- [Footer](#footer)

## Project Title & Badges 🏆

[![Java Version](https://img.shields.io/badge/Java-17-blue.svg)](https://www.java.com/)
[![Spring Boot Version](https://img.shields.io/badge/Spring%20Boot-3.2.0-green.svg)](https://spring.io/projects/spring-boot)
[![Docker](https://img.shields.io/badge/Docker-Ready-orange.svg)](https://www.docker.com/)
[![Kafka](https://img.shields.io/badge/Kafka-Enabled-red.svg)](https://kafka.apache.org/)

## Description 📝

The MedInsight microservices project provides a modular and scalable architecture for a healthcare information system. It consists of several independent services:

- **Dossier Service:** Manages patient medical records and consultations.
- **Lab Service:** Handles laboratory test requests and results.
- **Ordonnance Service:** Manages medical prescriptions.
- **Staff Service:** Manages hospital staff information, roles, and authentication integration with Keycloak.

These services communicate asynchronously via Kafka and are designed to be deployed using Docker Compose, providing a robust and maintainable platform.

## Features ✨

- **Microservice Architecture:** Independent services for better scalability and maintainability.
- **Patient Dossier Management:** Create, read, and manage patient medical records.
- **Lab Order Processing:** Initiate lab test requests and track their status.
- **Prescription Management:** Generate and manage patient prescriptions.
- **Staff Management:** Comprehensive management of healthcare professionals, including role-based access control.
- **Asynchronous Communication:** Utilizes Kafka for event-driven communication between microservices, ensuring decoupling and resilience.
- **Containerization:** Docker and Docker Compose for easy deployment and environment consistency.
- **Database Integration:** Uses PostgreSQL for Dossier, Lab, and Ordonnance services, and MySQL for the Staff service.
- **Security:** JWT-based authentication/authorization handled via a custom filter and integration with Keycloak for the Staff service.

## Tech Stack 🛠️

- **Languages:** Java 17
- **Frameworks:** Spring Boot, Spring Kafka, Spring Data JPA
- **Databases:** PostgreSQL, MySQL
- **Messaging:** Apache Kafka
- **Containerization:** Docker, Docker Compose
- **Authentication/Authorization:** Keycloak (for Staff Service), JWT, Custom Filters
- **Build Tool:** Maven
- **Other:** Lombok, Jackson

## Installation 🚀

This project is designed to be run using Docker Compose, which simplifies the setup of all necessary services, databases, and message brokers.

**Prerequisites:**

- Docker: [Install Docker](https://docs.docker.com/get-docker/)
- Docker Compose: Included with Docker Desktop or install separately.

**Steps:**

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/BoughanmiAsma/medinsight-microservice.git
    cd medinsight-microservice
    ```

2.  **Configure Environment Variables (Optional but Recommended):
    For the Staff Service, you might need to set up `KEYCLOAK_STAFF_CLIENT_SECRET` if not using default values or if Keycloak is configured differently.
    Ensure your `docker-compose.yml` and other configuration files reflect your environment setup.

3.  **Start all services using Docker Compose:**
    The main `docker-compose.yml` file orchestrates the setup of the core microservices (Dossier, Lab, Ordonnance) along with their dependencies (Postgres, Kafka, Zookeeper, Mongo).
    The `Staff-service` has its own `docker-compose.yml` which depends on a `microservices-net` network, suggesting it might need to be brought up in conjunction or after the main stack is running.

    To start the main microservices stack:
    ```bash
    docker-compose up -d
    ```
    This command will build the Docker images for each service (if not already present) and start them in detached mode.

    To start the Staff Service (ensure the `microservices-net` is available or adjust the `docker-compose.yml`):
    ```bash
    cd Staff-service
    docker-compose up -d
    ```

    *Note: The `docker-compose.yml` for `MedInsight-Microservices` includes services like Postgres, Mongo, Kafka, Zookeeper, Dossier Service, Lab Service, and Ordonnance Service. The `Staff-service` has its own `docker-compose.yml` which connects to a `microservices-net` network.* To run all services together, you might need to adjust network configurations or run them sequentially.

    **Recommended Approach for Full Stack:**
    It's often best to combine configurations or ensure network compatibility. For instance, you could potentially merge configurations or use a shared network definition if running all services within the same Docker Compose setup.

    A more integrated approach might involve defining all services within a single `docker-compose.yml` or ensuring the `microservices-net` is accessible to all.

    If you need to run them separately, ensure the dependent services (like Kafka or Postgres) are running and accessible from the service that depends on them.

4.  **Access Services:**
    Once the containers are up and running, the services will be accessible at their defined ports:
    - Dossier Service: `http://localhost:8080`
    - Lab Service: `http://localhost:8081`
    - Ordonnance Service: `http://localhost:8082`
    - Staff Service: `http://localhost:9005` (based on `Staff-service/docker-compose.yml` mapping `9005:9002`)

## Usage 🧑‍💻

This project comprises several microservices, each serving a distinct purpose within a healthcare platform.

### Inter-service Communication 📢

- **Kafka:** Services communicate asynchronously using Kafka topics.
  - The `Dossier Service` publishes events to `lab.requests` and `prescription.requests` topics.
  - The `Lab Service` consumes from `lab.requests` to create lab orders.
  - The `Ordonnance Service` consumes from `prescription.requests` to create prescriptions.

### Security 🔒

- **JWT & Header-based Authentication:**
  - Services use `JwtHeaderFilter` to extract user information and roles.
  - It prioritizes `X-User-*` headers (likely injected by an API Gateway like Kong) for user context.
  - As a fallback, it attempts to parse the `Authorization: Bearer <token>` header to extract user details from the JWT payload.
  - Role-based access control is implemented within controllers (e.g., `dossier:read`, `staff:write`).
- **Keycloak Integration (Staff Service):**
  - The `Staff Service` integrates with Keycloak for user management and role assignment.
  - When a staff member is created, a corresponding user is created in Keycloak, and specific roles (e.g., `ROLE_MEDECIN`, `ROLE_INFIRMIER`) are assigned based on their `StaffType`.

### Example Workflow 🔄

1.  A healthcare provider uses the **Dossier Service** API to create or update a patient's record.
2.  During a consultation, the provider might trigger a lab test request via the Dossier Service API (`POST /api/dossiers/{dossierId}/consultations/{consultationId}/lab-orders`). This publishes an event to the `lab.requests` Kafka topic.
3.  The **Lab Service** consumes this event, creates a `LabOrder` record in its database, and sets its status to 'PENDING'.
4.  Similarly, a prescription can be requested (`POST /api/dossiers/{dossierId}/consultations/{consultationId}/prescriptions`), publishing to `prescription.requests`.
5.  The **Ordonnance Service** consumes this event and creates a `Prescription` record.
6.  The **Staff Service** manages healthcare professionals. When a new doctor is added, their details are stored, a Keycloak user is created, and the appropriate role (`ROLE_MEDECIN`) is assigned.

## How to Use 🛠️

### Dossier Service 📄

- **Base URL:** `http://localhost:8080`
- **Endpoints:**
  - `GET /api/dossiers`: Retrieve all dossiers (requires `dossier:read` role).
  - `POST /api/dossiers`: Create a new dossier (requires `dossier:write` role).
  - `POST /api/dossiers/{dossierId}/consultations/{consultationId}/lab-orders`: Request a lab order (requires `dossier:write` role).
  - `POST /api/dossiers/{dossierId}/consultations/{consultationId}/prescriptions`: Request a prescription (requires `dossier:write` role).

### Lab Service 🧪

- **Base URL:** `http://localhost:8081`
- **Endpoints:**
  - `GET /api/lab-orders`: Retrieve all lab orders (requires `lab:read` role).
  - `GET /api/lab-orders/{id}`: Retrieve a specific lab order by ID (requires `lab:read` role).

### Ordonnance Service 💊

- **Base URL:** `http://localhost:8082`
- **Endpoints:**
  - `GET /api/prescriptions`: Retrieve all prescriptions (requires `ordonnance:read` role).
  - `GET /api/prescriptions/{id}`: Retrieve a specific prescription by ID (requires `ordonnance:read` role).

### Staff Service 🧑‍⚕️

- **Base URL:** `http://localhost:9005`
- **Endpoints:**
  - `POST /staffs`: Create a new staff member (requires `staff:write` role).
  - `GET /staffs`: Retrieve all staff members (requires `staff:read` role).
  - `GET /staffs/actifs`: Retrieve active staff members.
  - `GET /staffs/{id}`: Retrieve a specific staff member by ID.
  - `PUT /staffs/{id}`: Update a staff member.
  - `DELETE /staffs/{id}`: Delete a staff member (requires `staff:delete` role).
  - `GET /staffs/health`: Health check endpoint.

## Project Structure 📁

The project follows a standard microservice structure, with each service in its own directory.

```
medinsight-microservice/
├── docker-compose.yml
├── MedInsight-Microservices/
│   ├── dossier-service/
│   │   ├── Dockerfile
│   │   ├── pom.xml
│   │   ├── src/main/java/com/medinsight/dossier/
│   │   │   ├── DossierServiceApplication.java
│   │   │   ├── domain/Dossier.java
│   │   │   ├── event/KafkaProducerService.java
│   │   │   ├── repository/DossierRepository.java
│   │   │   ├── security/JwtHeaderFilter.java
│   │   │   ├── security/UserContext.java
│   │   │   └── web/DossierController.java
│   │   └── src/main/resources/application.properties
│   ├── lab-service/
│   │   ├── Dockerfile
│   │   ├── pom.xml
│   │   ├── src/main/java/com/medinsight/lab/
│   │   │   ├── LabServiceApplication.java
│   │   │   ├── domain/LabOrder.java
│   │   │   ├── event/LabOrderConsumer.java
│   │   │   ├── repository/LabOrderRepository.java
│   │   │   ├── security/JwtHeaderFilter.java
│   │   │   ├── security/UserContext.java
│   │   │   └── web/LabOrderController.java
│   │   └── src/main/resources/application.properties
│   └── ordonnance-service/
│       ├── Dockerfile
│       ├── pom.xml
│       ├── src/main/java/com/medinsight/ordonnance/
│       │   ├── OrdonnanceServiceApplication.java
│       │   ├── domain/Prescription.java
│       │   ├── event/PrescriptionConsumer.java
│       │   ├── repository/PrescriptionRepository.java
│       │   ├── security/JwtHeaderFilter.java
│       │   ├── security/UserContext.java
│       │   └── web/PrescriptionController.java
│       └── src/main/resources/application.properties
├── Staff-service/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── pom.xml
│   ├── src/main/java/com/medinsight/staff/
│   │   ├── DTO/StaffDTO.java
│   │   ├── StaffServiceApplication.java
│   │   ├── controllers/StaffController.java
│   │   ├── entities/Staff.java
│   │   ├── entities/StaffType.java
│   │   ├── exception/ResourceNotFoundException.java
│   │   ├── repositories/StaffRepositoy.java
│   │   ├── security/JwtHeaderFilter.java
│   │   ├── security/UserContext.java
│   │   ├── services/KeycloakUserService.java
│   │   └── services/Staffservice.java
│   ├── src/main/resources/db/migration/V1__init.sql
│   └── src/test/java/com/medinsight/staff/StaffServiceApplicationTests.java
├── kong/
│   └── Dockerfile
├── postgres/
│   └── kong-init.sql
└── keycloak/realms/
    └── medinsight-realm.json
```

## API Reference 📚

Detailed API endpoints for each service are described in the [Usage](#usage) section.

- **Dossier Service:** Manages patient records, lab orders, and prescriptions.
- **Lab Service:** Processes incoming lab requests and manages lab order status.
- **Ordonnance Service:** Handles the creation and management of medical prescriptions.
- **Staff Service:** Manages hospital staff, integrates with Keycloak for authentication, and assigns roles.

## Contributing 🤝

Contributions are welcome! Please feel free to:

- Fork the repository.
- Create a new branch for your feature or bug fix (`git checkout -b feature/your-feature`).
- Commit your changes (`git commit -am 'Add some feature'`).
- Push to the branch (`git push origin feature/your-feature`).
- Open a new Pull Request.

Please ensure your code adheres to the project's coding standards and includes relevant tests.

## License 📄

No license information was found in the repository analysis. Please refer to the project owner for licensing details.

## Important Links 🌐

- **Repository URL:** [https://github.com/BoughanmiAsma/medinsight-microservice](https://github.com/BoughanmiAsma/medinsight-microservice)
- **Author Profile:** [Asma Boughanmi](https://github.com/BoughanmiAsma) (Based on repository owner)

## Footer ✍️

This README was generated based on the analysis of the `medinsight-microservice` repository.

**Repository:** medinsight-microservice
**URL:** [https://github.com/BoughanmiAsma/medinsight-microservice](https://github.com/BoughanmiAsma/medinsight-microservice)

If you find this project useful, please consider starring ⭐, forking 🍴, and opening issues 🐛 or pull requests 💡!


---
**<p align="center">Generated by [ReadmeCodeGen](https://www.readmecodegen.com/)</p>**