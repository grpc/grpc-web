./init_submodules.sh
make clean
cd third_party/grpc/third_party/protobuf \
  && ./autogen.sh \
  && ./configure \
  && make install \
  && cd ../../../..
if [[ $(uname -r) == 16* ]];
then
  cd third_party/grpc \
  && CPPFLAGS=-DOSATOMIC_USE_INLINED=1 make install \
  && cd ../..
else
  cd third_party/grpc \
  && make install \
  && cd ../..
fi
export KERNEL_BITS=64
make
