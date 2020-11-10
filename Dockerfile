FROM alpine

RUN mkdir -p /omega/html
COPY html /omega/html
COPY omega /omega

WORKDIR /omega

ENTRYPOINT [ "./omega", "-p", "8000"]