.PHONY: build
build:
	GOOS=linux GOARCH=arm go build -o omega *.go

.PHONY: docker
docker:
	docker build . -t omega:latest

.PHONY: run
run:
	docker run -d -p3333:8000 omega:latest