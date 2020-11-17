.PHONY: build
build:
	go build -o pub *.go

.PHONY: build-arm
build-arm:
	GOOS=linux GOARCH=arm go build -o pub *.go

.PHONY: docker
docker:
	docker build . -t pub:latest

.PHONY: rund
rund:
	docker run -d -8000:8000 pub:latest