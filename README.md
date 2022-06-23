# code-share
A collaborative code editor

## Build
```
docker build -t code-share .
```

## deploy
The container needs to be run in privileged mode since it needs to create `bubblewrap` sandboxes for code execution.
```
docker run -d --restart unless-stopped --privileged --env GAPI_CLIENT_ID=$GAPI_CLIENT_ID -v /var/code-share/db:/db -p 8080:8080 code-share
```
