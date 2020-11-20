FROM alpine

RUN mkdir -p /pub/html
COPY html /pub/html
COPY pub /pub

WORKDIR /pub

ENTRYPOINT [ "./omega" ]