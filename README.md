# Dark Nebula Backend

This repository contains the Dockerized backend code for the Dark Nebula project.

## Quickstart

The provided Makefile simplifies the process of building and managing the Docker container for development. Here are the available commands:

### Build

To build the development Docker image from the Dockerfile, use:

```bash
make build
```

This command will check if the image already exists and remove it before building a new one if it does.

### Run

To run the development container in detached mode, use:

```bash
make run
```

The container will map your local `src` directory to the `/app/src` directory inside the container and bind to port 3000.

### Debug

If you need to access the running container using an interactive shell, use:

```bash
make debug
```

This will open a shell session inside the container where you can execute commands.

### Remove

To remove the running container and the built image, use:

```bash
make remove
```

This will force remove both the container and the image, allowing you to start fresh.
