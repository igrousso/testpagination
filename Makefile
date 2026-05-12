DOCKER ?= docker

up:
	$(DOCKER) compose up --build -d

down:
	$(DOCKER) compose down

restart:
	$(DOCKER) compose down
	$(DOCKER) compose up --build -d

logs:
	$(DOCKER) compose logs -f

prune:
	$(DOCKER) compose down
	$(DOCKER) system prune -af

.PHONY: up down restart logs prune