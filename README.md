# Tana & Flossy Renderer

A portable, authenticated Node.js + FFmpeg rendering service for the Tana & Flossy Animation Studio. It accepts complete scene configurations, queues asynchronous jobs, composites real video frames, mixes audio, and returns MP4 or WebM output.

This service does **not** fake character animation. Static compositing and camera work are operational. Blinking, breathing, hair motion, and lip-sync require properly separated production artwork. Complex performance requires a separately configured generative-motion provider.

## Included

- Dockerfile with Node 22 and FFmpeg
- Authenticated preview and final-render APIs
- Asynchronous queue, progress, cancellation, and persisted job records
- Static backgrounds and transparent foreground layers
- X/Y position, scale, rotation, opacity, depth, and timed layer visibility
- Camera crop, pan, push-in, pull-out, and zoom
- Dialogue, ambience, music, generated pink-noise ambience, and audio mixing
- H.264/AAC MP4 and VP9/Opus WebM encoding
- Filesystem storage adapter suitable for a Render persistent disk
- Character rig JSON Schema
- Real integration test that renders a six-second composited MP4

## Run locally

Requirements: Node.js 22+ and FFmpeg available on `PATH`.

```bash
cp .env.example .env
set -a; source .env; set +a
npm start
```

Run the production render test with `npm test`. Check the service with `curl http://localhost:8789/health`.

## Docker

```bash
docker build -t tana-flossy-renderer .
docker run --rm -p 8789:8789 --env-file .env -v tana-flossy-data:/data tana-flossy-renderer
```

## Deploy to Render

1. Upload this folder to a GitHub repository.
2. In Render, create a **Web Service** and connect the repository.
3. Select **Docker** as the runtime. The repository root is the Docker context.
4. Add a persistent disk mounted at `/data` if previews and job records must survive restarts.
5. Add the variables from `.env.example`. Use a long random `RENDERER_API_KEY` and mark it secret.
6. Set the health-check path to `/health` and deploy.
7. Set `RENDER_OUTPUT_BASE_URL` to your Render service URL plus `/outputs`.
8. Configure the ANTANYAHH website with the service origin as `RENDERER_BASE_URL` and the same `RENDERER_API_KEY`.

Render must have enough memory and CPU for FFmpeg. Preview rendering is intentionally lighter than final output.

## Environment

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port; Render supplies this automatically |
| `RENDERER_API_KEY` | Shared bearer secret required by render/job routes |
| `RENDER_JOB_DIR` | Persisted job JSON directory |
| `RENDER_OUTPUT_BUCKET` | Output directory for the filesystem adapter |
| `RENDER_TEMP_DIR` | Temporary FFmpeg working directory |
| `RENDER_OUTPUT_BASE_URL` | Public base URL used in completed job responses |
| `RENDER_ASSET_HOSTS` | Comma-separated host allowlist for downloaded media |
| `RENDER_ASSET_ROOT` | Root for trusted `asset:` references |
| `GENERATIVE_MOTION_PROVIDER` | Optional provider name; no provider is hard-coded |

## API

Render and job routes require `Authorization: Bearer YOUR_RENDERER_API_KEY`, `X-Render-Owner: authenticated-admin-id`, and `Content-Type: application/json`.

- `GET /health`
- `POST /v1/renders/preview`
- `POST /v1/renders/final`
- `GET /v1/renders/:id`
- `POST /v1/renders/:id/cancel`
- `GET /outputs/:id.mp4`
- `GET /outputs/:id.webm`

Example body:

```json
{
  "sceneId": "apartment-test",
  "episodeId": null,
  "scene": {
    "duration": 6,
    "width": 1280,
    "height": 720,
    "fps": 15,
    "background": { "color": "#302126" },
    "layers": [{ "source": "https://antanyahhbrand.net/media/tana.png", "x": 320, "y": 80, "scale": 0.7, "rotation": 0, "opacity": 1, "z": 10 }],
    "camera": { "type": "push-in", "intensity": 0.12 },
    "audio": [{ "generator": "pink-noise", "volume": 0.08 }],
    "format": "mp4"
  }
}
```

Job states are `QUEUED`, `PREPARING`, `RENDERING`, `ENCODING`, `COMPLETE`, `FAILED`, and `CANCELLED`.

## Character assets

See `spec/character-asset-manifest.schema.json`. Blinking must swap separate open/closed eye layers. Breathing must affect rigged body regions rather than scaling the entire portrait. Lip-sync must use mouth/viseme states. Unsupported motions must stay disabled in the Animation Studio.

## Storage

`src/storage.mjs` is the filesystem/persistent-disk adapter. It keeps the render API independent from a hosting provider. A future S3 or R2 adapter can implement the same methods without changing Studio requests or job semantics.
