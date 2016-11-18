./init_submodules.sh
make clean
cd third_party/protobuf && ./autogen.sh && ./configure && make -j && cd ../..
cd third_party/grpc && make -j && cd ../..
export KERNEL_BITS=64
make -j
