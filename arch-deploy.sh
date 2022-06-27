#!/bin/sh

case "$1" in
"-h" | "--help" | "")
    echo "Usage: ./arch-deploy.sh <DOMAIN> <GAPI_CLIENT_ID>"
    exit 0
    ;;
*)
    DOMAIN=$1
    GAPI_CLIENT_ID=$2
    ;;
esac

case "$2" in
"")
    echo "Usage: ./arch-deploy.sh <DOMAIN> <GAPI_CLIENT_ID>"
    exit 0
    ;;
esac

# Install requirements
pacman -S --noconfirm docker nginx certbot certbot-nginx
systemctl enable nginx --now
systemctl enable certbot-renew.timer --now

# Configure nginx
mkdir -p /etc/nginx/sites-enabled /etc/nginx/sites-available
cp -no-clobber /etc/nginx/nginx.conf /etc/nginx/nginx.conf.orig

cat << EOF > /etc/nginx/nginx.conf
worker_processes  1;
events {
    worker_connections  1024;
}
http {
    include            mime.types;
    default_type       application/octet-stream;
    sendfile           on;
    keepalive_timeout  65;

    include sites-enabled/*;
}
EOF

cat << EOF > /etc/nginx/sites-available/code-share_$DOMAIN.conf
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
    location / {
        proxy_pass http://unix:/var/code-share/socket/http;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
EOF

ln -s \
    /etc/nginx/sites-available/code-share_$DOMAIN.conf \
    /etc/nginx/sites-enabled/code-share_$DOMAIN.conf

certbot certificates 2> /dev/null \
    | grep $DOMAIN > /dev/null \
    || certbot --nginx -d $DOMAIN

sudo certbot install --cert-name $DOMAIN

docker build -t code-share .

docker kill code-share-server 2> /dev/null
docker container rm code-share-server 2> /dev/null
docker run \
    -d --restart unless-stopped \
    --name code-share-server \
    --user $(id -u http):$(id -g http) \
    --privileged \
    --env GAPI_CLIENT_ID="$GAPI_CLIENT_ID" \
    --env LISTEN="unix:/socket/http" \
    --env PM2_HOME=/tmp/pm2 \
    -v /var/code-share/db:/db \
    -v /var/code-share/socket:/socket \
    code-share

systemctl reload nginx
