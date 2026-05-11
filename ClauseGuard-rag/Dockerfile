FROM python:3.13-slim

WORKDIR /app

# Install system deps for torch/sentence-transformers
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Disable telemetry at build time
ENV ANONYMIZED_TELEMETRY=False
ENV POSTHOG_DISABLED=true

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["python", "run.py"]
