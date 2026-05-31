# Crowd-RAG Chatbot — task runner
# Usage: `just <recipe>`   (run `just` or `just help` to list recipes)

set shell := ["bash", "-cu"]

# Directories
backend_dir := "backend"
frontend_dir := "frontend"
venv := backend_dir / ".venv"
py := venv / "bin" / "python"
pip := venv / "bin" / "pip"

# ---- default ----

# List all recipes
default:
    @just --list

# ---- setup ----

# Install everything (backend venv + deps, frontend npm, .env files)
setup: setup-backend setup-frontend env
    @echo "✅ Setup complete. Fill in your keys in backend/.env and frontend/.env, then run: just verify"

# Create the backend venv and install Python deps
setup-backend:
    test -d {{venv}} || python3 -m venv {{venv}}
    {{pip}} install -q -r {{backend_dir}}/requirements.txt
    @echo "✅ Backend deps installed."

# Install frontend npm packages
setup-frontend:
    cd {{frontend_dir}} && npm install
    @echo "✅ Frontend deps installed."

# Create .env files from examples if they don't exist yet
env:
    test -f {{backend_dir}}/.env || cp {{backend_dir}}/.env.example {{backend_dir}}/.env
    test -f {{frontend_dir}}/.env || cp {{frontend_dir}}/.env.example {{frontend_dir}}/.env
    @echo "✅ .env files ready (edit them with your API keys)."

# ---- data ----

# Smoke-test connectivity to Gemini, Pinecone, Brave, and GitHub
verify:
    {{py}} scripts/verify_setup.py

# Embed seed products and upsert them into Pinecone
ingest:
    {{py}} scripts/ingest_products.py

# ---- run (individual) ----

# Start the FastAPI backend (http://localhost:7860)
backend:
    cd {{backend_dir}} && .venv/bin/uvicorn main:app --reload --port 7860

# Start the TanStack Start frontend (http://localhost:3000)
frontend:
    cd {{frontend_dir}} && npm run dev

# ---- run (one shot) ----

# Start backend + frontend together; Ctrl-C stops both
start:
    #!/usr/bin/env bash
    set -u
    echo "Starting backend (:7860) and frontend (:3000)…"
    ( cd {{backend_dir}} && .venv/bin/uvicorn main:app --reload --port 7860 ) &
    BACKEND_PID=$!
    ( cd {{frontend_dir}} && npm run dev ) &
    FRONTEND_PID=$!
    trap 'echo; echo "Stopping…"; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null' INT TERM EXIT
    wait

# ---- maintenance ----

# Build the frontend for production
build:
    cd {{frontend_dir}} && npm run build

# Typecheck the frontend
typecheck:
    cd {{frontend_dir}} && npx tsc --noEmit

# Remove build artifacts and virtualenv
clean:
    rm -rf {{venv}} {{frontend_dir}}/dist {{frontend_dir}}/.output
    find {{backend_dir}} -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
    @echo "✅ Cleaned."
