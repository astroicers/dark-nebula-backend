.PHONY: help dev-build dev-run dev-exec

help:
	@echo "Available commands:"
	@echo "  make dev-build             - Builds the development Docker image from the Dockerfile"
	@echo "  make dev-run               - Runs the development container in detached mode"
	@echo "  make dev-exec              - Accesses the running container using an interactive shell"

.DEFAULT_GOAL := help

dev-build:
	sudo docker build -t dark-nebula-backend-image . --no-cache

dev-run:
	sudo docker run -itd --name dark-nebula-backend-container -v ./backend/:/app -p 3000:3000 dark-nebula-backend-image

dev-exec:
	sudo docker exec -it dark-nebula-backend-container /bin/sh
