FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY spec ./spec
ENV PORT=8789 RENDER_JOB_DIR=/data/jobs RENDER_OUTPUT_BUCKET=/data/outputs RENDER_TEMP_DIR=/tmp/tf-renderer
RUN mkdir -p /data/jobs /data/outputs /tmp/tf-renderer && chown -R node:node /data /tmp/tf-renderer /app
USER node
EXPOSE 8789
HEALTHCHECK CMD node -e "fetch('http://127.0.0.1:8789/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node","src/server.mjs"]
