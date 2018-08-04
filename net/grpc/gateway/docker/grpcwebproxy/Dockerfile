FROM golang:alpine

RUN apk add --no-cache git ca-certificates && \
  rm -rf /var/lib/apt/lists/*

RUN go get -v -u github.com/golang/dep/cmd/dep
RUN go get -v github.com/improbable-eng/grpc-web/go/grpcwebproxy ; exit 0
RUN cd src/github.com/improbable-eng/grpc-web && dep ensure
RUN go get -v -u github.com/improbable-eng/grpc-web/go/grpcwebproxy

ADD ./etc/localhost.crt /etc
ADD ./etc/localhost.key /etc

ENTRYPOINT [ "/bin/sh", "-c", "exec /go/bin/grpcwebproxy \
  --backend_addr=echo-server:9090 \
  --server_bind_address=0.0.0.0 \
  --server_http_debug_port=8080 \
  --run_http_server=true \
  --server_tls_cert_file=/etc/localhost.crt \
  --server_tls_key_file=/etc/localhost.key " ]
