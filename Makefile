.DEFAULT_GOAL := help

.PHONY: help install check open smoke api regression spec build run-check run-smoke run-api run-regression run-spec

help:
	@printf '%s\n' \
	  'make install               Install locked dependencies and prepare Cypress' \
	  'make check                 Check JavaScript syntax locally' \
	  'make open                  Open the interactive Cypress runner' \
	  'make smoke                 Run headless Smoke locally' \
	  'make api                   Run API tests locally' \
	  'make regression            Run full headless Regression locally' \
	  'make spec SPEC=<path>      Run one local spec' \
	  'make build                 Build the pinned test image' \
	  'make run-check             Check JavaScript inside the image' \
	  'make run-smoke             Run Smoke inside the image' \
	  'make run-api               Run API tests inside the image' \
	  'make run-regression        Run full Regression inside the image' \
	  'make run-spec SPEC=<path>  Run one spec inside the image'

install:
	npm ci --ignore-scripts
	npx cypress install
	npx cypress verify

check:
	npm run check

open:
	npm run cy:open

smoke:
	npm run test:smoke

api:
	npm run test:api

regression:
	npm run test:regression

spec:
	@test -n "$(SPEC)" || { printf '%s\n' 'Usage: make spec SPEC=cypress/e2e/<group>/<file>.cy.js' >&2; exit 2; }
	npm run test:spec -- "$(SPEC)"

build:
	@sh scripts/docker.sh build

run-check:
	@sh scripts/docker.sh check

run-smoke:
	@sh scripts/docker.sh smoke

run-api:
	@sh scripts/docker.sh api

run-regression:
	@sh scripts/docker.sh regression

run-spec:
	@test -n "$(SPEC)" || { printf '%s\n' 'Usage: make run-spec SPEC=cypress/e2e/<group>/<file>.cy.js' >&2; exit 2; }
	@sh scripts/docker.sh spec "$(SPEC)"
