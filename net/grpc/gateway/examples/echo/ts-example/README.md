# Instructions to run the Typescript example

## Docker run

```bash
# From root dir
docker-compose up --build node-server envoy ts-client
```

Visit http://localhost:8081/echotest.html

## Manual run

### Step 1 - Run servers

```bash
# From root dir
docker-compose up --build node-server envoy
```

### Step 2 - Codegen
```bash
cd net/grpc/gateway/examples/echo
```

#### Option 1: `import_style=commonjs+dts`

```
RUN protoc -I=. echo.proto \
  --js_out=import_style=commonjs:./ts-example \
  --grpc-web_out=import_style=commonjs+dts,mode=grpcwebtext:./ts-example
```

#### Option 2: `import_style=typescript`

```
RUN protoc -I=. echo.proto \
  --js_out=import_style=commonjs:./ts-example \
  --grpc-web_out=import_style=typescript,mode=grpcwebtext:./ts-example
```

### Step 3 - (Optional) Update import style

Change `client.ts` to use import style Option 2 if you had chosen `import_style=typescript` above:

https://github.com/grpc/grpc-web/blob/60caece15489787662ebac6167572eecd5bfa568/net/grpc/gateway/examples/echo/ts-example/client.ts#L26-L27

### Step 4 - Build JS files.

```bash
cd net/grpc/gateway/examples/echo/ts-example
npm install
npx tsc
mv *_pb.js dist/
npx webpack
```

### Step 5 - Host and visit page

```bash
# In the ./ts-example folder
python3 -m http.server 8081
```

Visit http://localhost:8081/echotest.html