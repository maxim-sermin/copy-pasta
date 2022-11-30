FROM nginx:alpine
COPY ./nginx.conf.template /var/nginx.conf.template
COPY ./www /usr/share/nginx/html
COPY ./run_nginx_heroku.sh /var/run_nginx_heroku.sh
CMD chmod a+x /var/run_nginx_heroku.sh
ENTRYPOINT ["/bin/sh", "/var/run_nginx_heroku.sh"]
