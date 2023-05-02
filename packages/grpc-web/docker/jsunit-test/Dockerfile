FROM selenium/standalone-chrome:93.0.4577.63

# Matching the node version used in the node:20.0.0-bullseye image.
ARG NODE_VERSION=20.0.0

USER root

RUN apt-get update && \
  apt-get install -y nodejs npm

# Install nvm (See https://github.com/creationix/nvm#install-script) and nodejs version per
# specified in NODE_VERSION
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
ENV NVM_DIR=$HOME/.nvm
RUN . $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

WORKDIR /grpc-web

COPY ./packages ./packages
RUN cd ./packages/grpc-web && \
  npm install

COPY ./javascript ./javascript
COPY ./scripts ./scripts
