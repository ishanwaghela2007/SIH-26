# SIH 2026 shared Docker runtime

All project containers are started from this directory. Service-local Dockerfiles and Compose files are intentionally not used.

## Start the backend

```bash
cd docker
docker compose --env-file .env up --build
```

This starts PostgreSQL, Redis, Kafka, auth-service, worker-service, and job-service. The database init script creates the auth, worker, and job databases on the first PostgreSQL volume initialization.

## Start Ollama too

```bash
# pull models into your host's Ollama registry (mapped to container's /root/.ollama)
docker compose --env-file .env --profile ai up --build
docker cp ~/.ollama/. sih_ollama:/root/.ollama  # copy local models
docker exec -it sih_ollama ollama pull gemma3:4b  # or pull inside container
```

The Language Bridge should use `OLLAMA_BASE_URL=http://ollama:11434` and `OLLAMA_MODEL` from the shared environment.

## Host ports

- Auth HTTP: `3001`
- Auth gRPC: `50051`
- Worker HTTP: `3002`
- Job HTTP: `3003`
- PostgreSQL: `5432`
- Redis: `6379`
- Kafka: `9092`
- Ollama: `11434` (AI profile)

Do not run `docker compose down -v` unless you intentionally want to delete the local PostgreSQL and Ollama volumes.
