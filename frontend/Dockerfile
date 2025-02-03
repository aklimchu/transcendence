FROM alpine:3.20.3

RUN apk update && apk add nginx openssl

RUN mkdir -p /etc/nginx/ssl
RUN openssl req -x509 -nodes \
    -out /etc/nginx/ssl/certificate.crt \
    -keyout /etc/nginx/ssl/certificate.key \
    -subj "/C=FI/ST=UUSIMA/L=HELSINKI/O=HIVE/OU=HIVE/CN=Will it pong?"

COPY nginx.conf /etc/nginx/nginx.conf

RUN adduser -D -H -s /sbin/nologin -g www-data -G www-data www-data
RUN chown www-data /var/www

CMD ["nginx", "-g", "daemon off;"]