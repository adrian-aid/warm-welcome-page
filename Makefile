# AUS Banking Intelligence — Developer Makefile
# Run `make help` to see all available targets.

.DEFAULT_GOAL := help
.PHONY: help dev backend frontend install lint typecheck test build clean refresh-cache cache-status

# ─── Colours ──────────────────────────────────────────────────────────────────
BOLD  := \033[1m
RESET := \033[0m
GREEN := \033[32m
AMBER := \033[33m

# ─── Help ─────────────────────────────────────────────────────────────────────
help: ## Show this help message
	@echo ""
	@echo "$(BOLD)AUS Banking Intelligence — Developer Commands$(RESET)"
	@echo ""
	@echo "$(BOLD)Usage:$(RESET) make <target>"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ { printf "  $(GREEN)%-18s$(RESET) %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(AMBER)Prerequisites:$(RESET) Node.js 18+, Python 3.9+, pip"
	@echo ""

# ─── Setup ────────────────────────────────────────────────────────────────────
install: ## Install all frontend and backend dependencies
	@echo "$(BOLD)Installing frontend dependencies...$(RESET)"
	npm install
	@echo "$(BOLD)Installing backend dependencies...$(RESET)"
	pip install -r backend/requirements.txt
	pip install ruff mypy pytest pytest-asyncio httpx
	@echo "$(GREEN)✓ All dependencies installed$(RESET)"

setup-env: ## Copy .env.example to .env (won't overwrite existing)
	@if [ -f backend/.env ]; then \
		echo "$(AMBER)backend/.env already exists — not overwriting$(RESET)"; \
	else \
		cp backend/.env.example backend/.env; \
		echo "$(GREEN)✓ Created backend/.env — add your GROQ_API_KEY$(RESET)"; \
	fi

# ─── Run ──────────────────────────────────────────────────────────────────────
dev: ## Start both frontend and backend in parallel (requires tmux or two tabs)
	@echo "$(BOLD)Starting backend and frontend...$(RESET)"
	@echo "$(AMBER)Tip: run 'make backend' and 'make frontend' in separate terminals for better logs$(RESET)"
	@(uvicorn backend.main:app --reload --port 8000 &) && npm run dev

backend: ## Start the FastAPI backend on port 8000
	@echo "$(BOLD)Starting backend on http://localhost:8000$(RESET)"
	@echo "$(AMBER)API docs: http://localhost:8000/docs$(RESET)"
	uvicorn backend.main:app --reload --port 8000

frontend: ## Start the Vite dev server on port 8080
	@echo "$(BOLD)Starting frontend on http://localhost:8080$(RESET)"
	npm run dev

demo: ## Start backend in DEMO_MODE (no Groq API key needed)
	@echo "$(BOLD)Starting backend in DEMO_MODE...$(RESET)"
	DEMO_MODE=true uvicorn backend.main:app --reload --port 8000

# ─── Quality ──────────────────────────────────────────────────────────────────
lint: ## Run ESLint (frontend) and Ruff (backend)
	@echo "$(BOLD)Linting frontend...$(RESET)"
	npm run lint
	@echo "$(BOLD)Linting backend...$(RESET)"
	ruff check backend/
	ruff format --check backend/
	@echo "$(GREEN)✓ Lint passed$(RESET)"

lint-fix: ## Auto-fix lint issues where possible
	@echo "$(BOLD)Auto-fixing frontend...$(RESET)"
	npx eslint src/ --fix
	@echo "$(BOLD)Auto-fixing backend...$(RESET)"
	ruff check --fix backend/
	ruff format backend/
	@echo "$(GREEN)✓ Auto-fix complete$(RESET)"

typecheck: ## Run tsc (frontend) and mypy (backend)
	@echo "$(BOLD)Type-checking frontend...$(RESET)"
	npx tsc --noEmit --project tsconfig.app.json
	@echo "$(BOLD)Type-checking backend...$(RESET)"
	mypy backend/ --ignore-missing-imports --explicit-package-bases
	@echo "$(GREEN)✓ Type check passed$(RESET)"

test: ## Run backend tests (pytest)
	@echo "$(BOLD)Running backend tests...$(RESET)"
	@if [ -d "backend/tests" ] && [ "$$(find backend/tests -name 'test_*.py' | wc -l)" -gt 0 ]; then \
		pytest backend/tests/ -v --tb=short; \
	else \
		echo "$(AMBER)⚠️  No tests found in backend/tests/$(RESET)"; \
		echo "   Writing tests is the highest-priority engineering debt item."; \
	fi

test-cov: ## Run tests with coverage report
	pytest backend/tests/ --cov=backend --cov-report=term-missing -v

build: ## Build the frontend for production
	@echo "$(BOLD)Building frontend...$(RESET)"
	npm run build
	@echo "$(GREEN)✓ Build complete → dist/$(RESET)"

check: lint typecheck build ## Run all quality checks (lint + typecheck + build)
	@echo "$(GREEN)$(BOLD)✓ All checks passed$(RESET)"

# ─── Data ─────────────────────────────────────────────────────────────────────
clear-cache: ## Delete all cached data files (forces re-fetch on next backend start)
	@echo "$(BOLD)Clearing data cache...$(RESET)"
	rm -f backend/data/cache/*.csv backend/data/cache/*.xlsx backend/data/cache/*.xls backend/data/cache/_insights_cache.txt
	@echo "$(GREEN)✓ Cache cleared — restart the backend to re-fetch all data$(RESET)"

refresh-data: ## Force-refresh all live data (clears cache + triggers backend warm)
	@echo "$(BOLD)Refreshing data from live sources...$(RESET)"
	$(MAKE) clear-cache
	@echo "$(AMBER)Restart the backend to re-fetch. Or if already running, it will refresh on next request.$(RESET)"

refresh-cache: ## Call /api/admin/refresh-cache while backend is running (no restart needed)
	@echo "$(BOLD)Calling live refresh endpoint...$(RESET)"
	@curl -s -X POST "http://localhost:8000/api/admin/refresh-cache" \
	     -H "Content-Type: application/json" \
	     ${ADMIN_KEY:+-H "X-Admin-Key: $(ADMIN_KEY)"} \
	     | python3 -m json.tool || echo "$(AMBER)Is the backend running? Try: make backend$(RESET)"

cache-status: ## Show age and size of all cached data files (no restart needed)
	@echo "$(BOLD)Cache file status:$(RESET)"
	@curl -s "http://localhost:8000/api/admin/cache-status" \
	     ${ADMIN_KEY:+-H "X-Admin-Key: $(ADMIN_KEY)"} \
	     | python3 -m json.tool || echo "$(AMBER)Is the backend running? Try: make backend$(RESET)"

# ─── Audit ────────────────────────────────────────────────────────────────────
audit: ## Run security audits for both frontend and backend
	@echo "$(BOLD)Auditing frontend dependencies...$(RESET)"
	npm audit --audit-level=moderate
	@echo "$(BOLD)Auditing backend dependencies...$(RESET)"
	pip-audit -r backend/requirements.txt --skip-editable || echo "$(AMBER)pip-audit not installed — run: pip install pip-audit$(RESET)"

# ─── Clean ────────────────────────────────────────────────────────────────────
clean: ## Remove build artifacts and caches
	@echo "$(BOLD)Cleaning build artifacts...$(RESET)"
	rm -rf dist/ node_modules/.cache
	find backend -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	find backend -name "*.pyc" -delete 2>/dev/null || true
	@echo "$(GREEN)✓ Clean complete$(RESET)"
