./init_submodules.sh
make clean
cd third_party/protobuf && ./autogen.sh && ./configure && make && cd ../..
cd third_party/grpc && make && cd ../..
export KERNEL_BITS=64
make
