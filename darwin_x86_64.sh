./init_submodules.sh
make clean
cd /github/grpc-web/third_party/protobuf && ./autogen.sh && ./configure && make && cd ../..
cd /github/grpc-web/third_party/grpc && make && cd ../..
export KERNEL_BITS=64
make
