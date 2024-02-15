.PHONY: help build run debug remove

help:
	@echo "Available commands:"
	@echo "  make build             - Builds the development Docker image from the Dockerfile"
	@echo "  make run               - Runs the development container in detached mode"
	@echo "  make exec              - Accesses the running container using an interactive shell"
	@echo "  make remove            - Removes the running container and the built image"

.DEFAULT_GOAL := help

build:
	@if sudo docker images | grep -q "dark-nebula-backend-image"; then \
		echo "Image exists. Removing..."; \
		sudo docker rmi -f dark-nebula-backend-image; \
	else \
		echo "Image does not exist. Continuing..."; \
	fi
	sudo docker build -t dark-nebula-backend-image . --no-cache

run:
	@if sudo docker ps -a | grep -q "dark-nebula-backend-container"; then \
		echo "Container exists. Removing..."; \
		sudo docker rm -f dark-nebula-backend-container; \
	else \
		echo "Container does not exist. Continuing..."; \
	fi
	sudo docker run -itd --name dark-nebula-backend-container -v ./src:/app/src -p 3000:3000 --network host dark-nebula-backend-image

debug:
	sudo docker exec -it dark-nebula-backend-container /bin/sh

remove:
	sudo docker rm -f dark-nebula-backend-container
	sudo docker rmi -f dark-nebula-backend-image