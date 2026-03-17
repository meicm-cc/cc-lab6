# Cloud Computing – Lab 04: Edge Routing and API Gateways
**Master in Computer Engineering – Mobile Computing (2025/2026)**

**Date:** 17th March 2026

**Objective:** In this lab, you are acting as a Platform Engineer. The software development team has provided you with the source code for a new microservice architecture. Your mission is to containerize the applications, orchestrate them alongside a database, and secure the entire ecosystem behind an **API Gateway** using public wildcard domains (`*.meicm.pt`).

**Prerequisites:** Visual Studio Code, Docker CLI, and this repository's source code.

---

### Phase 1: Environment Setup & Architecture Review
The development team has provided you with this repository. Clone it to your workspace. 

You should see two directories:
1. `/frontend`: Contains a static `index.html` dashboard.
2. `/api`: Contains a Node.js Express application that requires a Redis database.

**Your Architectural & Networking Constraints:**
* The API must connect to a Redis database using the `REDIS_URL` environment variable.
* **The Zero-Trust Network Rule:** The Frontend, API, and Database containers **must not** expose any ports to the host machine. 
* All external traffic must flow through a single Reverse Proxy / API Gateway (e.g., Nginx Proxy Manager).
* The Gateway must be the *only* container allowed to bind to the host's ports (80 for HTTP, 81 for Admin UI).

---

### Phase 2: The Containerization Challenge
Your first task is to write the `Dockerfile`s for the provided source code.

**Task 2.1: The Frontend Container**
Inside the `/frontend` directory, create a `Dockerfile` that uses an `nginx:alpine` base image to serve the `index.html` file.

**Task 2.2: The API Container**
Inside the `/api` directory, create an optimized **Multi-Stage `Dockerfile`** for the Node.js application. 
* *Requirement 1:* Utilize Layer Caching for the `package.json` dependencies.
* *Requirement 2:* Use `node:18-alpine` for both the build and production stages.
* *Requirement 3:* The production container must run as the non-root `node` user.

---

### Phase 3: The Network & Orchestration Challenge
Now that your containers can be built, you must orchestrate the ecosystem and design the network topology. 

Start with the `docker-compose.yml` file that is present in the root directory. You must define **three** more services along the API Gateway (`jc21/nginx-proxy-manager:latest` image): the frontend, the API and the Redis cache.

**Focus on Docker Networking:**
In a Compose environment, Docker automatically creates a custom bridge network for your stack. This provides internal DNS resolution. 
* Your API Gateway container will not be able to route traffic using `localhost`, because `localhost` inside the Gateway container refers to itself! 
* To route traffic to the API or Frontend, the Gateway must use the exact **service names** you define in this YAML file. 
* Ensure your database uses a Docker Volume to persist data across restarts.

Once your YAML file is complete, boot the architecture in dettached mode:
```bash
docker compose up -d --build
```

### Phase 4: Configure the Edge Router
Now that all services are running, we should configure the different services that will be proxied through NPM.

1. Open your browser and log into the NPM Admin UI at `http://localhost:81`.
2. Configure the frontend service with the domain: app.meicm.pt
3. **Remember:** proxy is in the same network as the other containers, so it can resolve their hostnames.
4. Define port number and add the host.
5. Repeat these steps for the API service
	5.1. Use the domain api.meicm.pt

### Phase 5: Validation
Open the web browser at http://app.meicm.pt
Test every functionality and make sure that frontend, API and Redis are working properly.

### Phase 6: Homework: Create Your Own Domain + SSL
As an extra exercise, the challenge is to create your own domain and generate SSL certificates to serve the application as HTTPS.
**Suggestion:** use duckdns.org for free domains/sub-domains. It also provides DNS challenge token to generate Let's Encrypt certificates.

