# gRPC-Web Roadmap

The purpose of this document is to collect all the features that we believe are
useful for gRPC users.

## Background

gRPC-Web has been developed internally at Google as part of the front-end
stacks for Google's Web applications and cloud services. Over time we plan to
open-source and publish most of the features and make them available to open-source
users.

Like everywhere, Web platforms and technologies are constantly evolving, often
with many inter-dependent ecosystems. As much as we like to open-source
everything, we also need keep the balance between creating a reusable and stable
open-source solution and meeting those requirements unique to Google's Web applications
(such as search). 

## Roadmap Features

> NOTE: Due to the status of two of gRPC-Web’s core dependencies — [Google
Closure](https://github.com/google/closure-library/issues/1214), which has been
archived, and [Protobuf
JavaScript](https://github.com/protocolbuffers/protobuf-javascript?tab=readme-ov-file#project-status),
which is receiving only minimal updates — the gRPC-Web project is no longer able
to deliver new, modern solutions for the open source community. As a result, we
do not plan to be adding new features going forward.
>
> We recommend you to use [gRPC-Gateway](https://github.com/grpc-ecosystem/grpc-gateway) as an alternative.

### TypeScript Codebase
Migrate the codebase to TypeScript and update the related toolchains (incl. remove
dependency on `closure-compiler`). Enhance overall TypeScript support.

### Streaming Support

Enhance Fetch/streams support (e.g. cancellation support) and improve runtime
support, including service workers.

See streaming roadmap [here](streaming-roadmap.md).

### Non-Binary Message Encoding

The binary protobuf encoding format is not most CPU efficient for browser
clients. Furthermore, the generated code size increases as the total protobuf
definition increases.

For Google's Web applications (e.g. gmail), we use a JSON like format which is
comparable to JSON in efficiency but also very compact in both the message size
and code size.

### Security

We plan to publish a comprehensive guideline doc on how to create secure Web
applications.

Native support such as XSRF, XSS prevention may also be added to the gRPC-Web
protocol.

### Web Framework Integration

This is to provide first-class support for gRPC API and gRPC-Web in popular Web
frameworks such as Angular. 

Note: Dart gRPC will use gRPC-Web as the underlying implementation on the
Dart Web platform.

### Non-Closure compiler support

With the addition of CommonJS style imports, gRPC-Web client stubs can now be
compiled with various tools such as Browserify, Webpack, etc. Let us know
what else we should try!