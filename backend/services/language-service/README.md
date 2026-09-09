# Language Service

The Language Bridge is an authenticated HTTP service backed by Ollama. It provides language detection, translation, and structured intent extraction for household and community service conversations.

Endpoints:

- `POST /language/detect`
- `POST /language/translate`
- `POST /language/understand`
- `GET /language/ready`

All endpoints require an Auth Service bearer token. The service does not store prompts or model responses and does not expose Ollama directly to clients.

Configure `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, and `OLLAMA_TIMEOUT_MS`. In the shared Docker setup, start the AI profile and pull the configured model into the Ollama volume before making requests.
