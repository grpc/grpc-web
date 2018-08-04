FROM golang:alpine

RUN apk add --no-cache curl git ca-certificates && \
  rm -rf /var/lib/apt/lists/*

ARG VERSION=0.6.2

RUN curl https://raw.githubusercontent.com/golang/dep/master/install.sh | sh
RUN wget https://github.com/improbable-eng/grpc-web/archive/$VERSION.tar.gz
RUN mkdir -p /go/src/github.com/improbable-eng/
RUN tar -zxvf $VERSION.tar.gz -C /go/src/github.com/improbable-eng/
RUN cd /go/src/github.com/improbable-eng && mv grpc-web-$VERSION grpc-web
RUN cd /go/src/github.com/improbable-eng/grpc-web && \
  dep ensure --vendor-only && \
  go install ./go/grpcwebproxy

ADD ./etc/localhost.crt /etc
ADD ./etc/localhost.key /etc

ENTRYPOINT [ "/bin/sh", "-c", "exec /go/bin/grpcwebproxy \
  --backend_addr=echo-server:9090 \
  --server_bind_address=0.0.0.0 \
  --server_http_debug_port=8080 \
  --run_http_server=true \
  --server_tls_cert_file=/etc/localhost.crt \
  --server_tls_key_file=/etc/localhost.key " ]
