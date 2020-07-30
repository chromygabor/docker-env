# docker-env

Javascript development environmen using docker.

---

# Intro

This project is a way to use docker to help in a full-stack javascript project development.

It shows how to create folder structure, how to run services and containers and how to attach them via shell and run the corresponding scripts.

## Create the folder structure

It is the easiest part of the whole thing. The folders are containing basic projects. They are doesn't make any sense.

```
main-project-folder/
  frontend-folder/
    Dockerfile
    package.json
  backend-folder/
    Dockerfile
    package.json
  docker-compose.yml
  docker-compose-dev.yml
  docker-env.js
```

## Create docker images
