# Scripts

A collection of scripts (mostly test related).


## Troubleshooting - Bazel Crashes (OOM)

[Bazel](https://github.com/bazelbuild/bazel) can be memory hungry and often
crashes while building on Mac with default Docker memory settings (2GB)
(similar reports: [here](https://github.com/tensorflow/models/issues/3647) and
[here](https://stackoverflow.com/questions/65605663/cannot-build-with-error-server-terminated-abruptly)).


Bump the [memory settings](https://docs.docker.com/docker-for-mac/#resources)
in Docker Desktop for Mac (e.g. to 4 - 6GB) if you see the following errors:


```
$ bazel build //javascript/net/grpc/web/generator/... //net/grpc/gateway/examples/echo/...

...

Server terminated abruptly (error code: 14, error message: 'Socket closed', log file: '/root/.cache/bazel/_bazel_root/.../server/jvm.out')

------

failed to solve: rpc error: code = Unknown desc = executor failed running [/bin/sh -c bazel build javascript/net/grpc/web/... &&   cp $(bazel info bazel-genfiles)/javascript/net/grpc/web/protoc-gen-grpc-web   /usr/local/bin/protoc-gen-grpc-web]: exit code: 37
```
