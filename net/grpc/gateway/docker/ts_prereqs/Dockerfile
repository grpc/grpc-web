  # 1. Start from the image built by the original prereqs file!
  FROM grpcweb/prereqs
  
  WORKDIR /github/grpc-web
  COPY . .
  
  # 2. Create the folder and generate protos
   RUN mkdir -p ./src/typescript/generated && \
        protoc -I=./src/typescript/proto -I=/usr/local/include \
        ./src/typescript/proto/status.proto \
        --js_out=import_style=commonjs:./src/typescript/generated \
        --grpc-web_out=import_style=commonjs+dts,mode=grpcwebtext:./src/typescript/generated
  
  
  # 3. Build the Closure Wrapper
  RUN cd packages/closure-wrapper && \
      yarn install && \
      yarn build
  
  # 4. Build the main TS project
  RUN cd packages/grpc-web && \
      npm install --ignore-scripts && \
      npm run build

      RUN cd packages/grpc-web && npx mocha --timeout 10000 test/tsc_test.js
  