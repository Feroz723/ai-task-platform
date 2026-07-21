FROM python:3.12-slim AS builder
WORKDIR /app
COPY apps/worker/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim AS runner
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY apps/worker/ .
USER appuser
CMD ["python", "main.py"]
