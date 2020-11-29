FROM alpine:3.7

RUN apk add --no-cache bash

RUN mkdir -p /pub/html
COPY html /pub/html
COPY pub /pub

WORKDIR /pub

ENTRYPOINT [ "./pub" ]