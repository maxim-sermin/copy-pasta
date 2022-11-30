#!/bin/sh
export DOLLAR='$'
envsubst < /var/nginx.conf.template > /etc/nginx/nginx.conf
nginx -g "daemon off;"
