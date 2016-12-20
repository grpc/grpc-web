cat $ngx_addon_dir/config.make
for grpc_gateway_src in $GRPC_GATEWAY_CXX;
do
  grpc_gateway_obj=$(echo ./objs/addon/$(basename $(dirname $grpc_gateway_src))/$(basename $grpc_gateway_src): | sed 's/\.cc/\.o/g')
  cat << END >> $NGX_MAKEFILE

$grpc_gateway_obj CFLAGS += -std=c++11 -D__STDC_FORMAT_MACROS

END
done
