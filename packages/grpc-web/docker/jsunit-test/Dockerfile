FROM selenium/standalone-chrome:112.0.5615.165

ARG NODE_VERSION=20.0.0
USER root

# Install Node.js dependencies
RUN apt-get update && apt-get install -y nodejs npm curl

# Install nvm and set up Node.js
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
ENV NVM_DIR=$HOME/.nvm
RUN . $NVM_DIR/nvm.sh && \
    nvm install $NODE_VERSION && \
    nvm alias default $NODE_VERSION && \
    nvm use default
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

WORKDIR /grpc-web

# Copy all needed files before running npm install or compiler
COPY ./packages ./packages
COPY ./javascript ./javascript
COPY ./scripts ./scripts

# Install npm dependencies and build the JS library
WORKDIR /grpc-web/packages/grpc-web
RUN npm install
