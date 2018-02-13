cd "$(dirname "$0")"
./init_submodules.sh
cd ..
make clean
cd third_party/grpc/third_party/protobuf \
  && ./autogen.sh \
  && ./configure \
  && make install -j8 \
  && cd ../../../..
if [[ $(uname -r) == 16* ]]; # Mac OS X Sierra
then
  cd third_party/grpc \
    && CPPFLAGS=-DOSATOMIC_USE_INLINED=1 make install \
    && cd ../..
else
  cd third_party/grpc \
    && make install -j8 \
    && cd ../..
fi
export KERNEL_BITS=64
make
