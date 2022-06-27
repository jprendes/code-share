# code-share
A collaborative code editor

## Quick start
Run `arch-deploy.sh` on an ArchLinux server. It should be easy to adapt the script for other distributions.

```bash
DOMAIN=example.com
GAPI_CLIENT_ID=xxx
./arch-deploy.sh $DOMAIN $GAPI_CLIENT_ID
```

## Manual deployment

### Build
```
docker build -t code-share .
```

### Deploy
The container needs to be run in privileged mode since it needs to create `bubblewrap` sandboxes for code execution.
```
docker run -d --restart unless-stopped --privileged --env DEFAULT_PUBLIC=1 --env GAPI_CLIENT_ID=$GAPI_CLIENT_ID -v /var/code-share/db:/db -p 8080:8080 code-share
```

If you are not setting up a reverse proxy, you might also want to set `--env HTTPS=1`.