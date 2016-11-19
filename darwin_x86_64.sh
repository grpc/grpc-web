./init_submodules.sh
make clean
cd third_party/protobuf && ./autogen.sh && ./configure && make -j8 && cd ../..
cd third_party/grpc && make -j8 && cd ../..
export KERNEL_BITS=64
make
