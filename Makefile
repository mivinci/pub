.PHONY: build
build:
	go build -o omega *.go

.PHONY: build-arm
build-arm:
	GOOS=linux GOARCH=arm go build -o omega *.go

.PHONY: docker
docker:
	docker build . -t omega:latest

.PHONY: rund
rund:
	docker run -d -8000:8000 omega:latest