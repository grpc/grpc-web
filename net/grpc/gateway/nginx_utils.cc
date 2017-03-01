#include "net/grpc/gateway/nginx_utils.h"

namespace grpc {
namespace gateway {
namespace {
void AddElementToNginxElementTable(ngx_pool_t *pool, ngx_list_t *table,
                                   const string &name,
                                   const string_ref &value) {
  ngx_table_elt_t *ngx_key_value =
      reinterpret_cast<ngx_table_elt_t *>(ngx_list_push(table));
  if (ngx_key_value == nullptr) {
    ERROR("Failed to allocate response initial metadata for nginx.");
  }
  ngx_key_value->key.len = name.size();
  ngx_key_value->key.data =
      reinterpret_cast<u_char *>(ngx_palloc(pool, name.size()));
  ngx_copy(ngx_key_value->key.data, name.c_str(), name.size());
  ngx_key_value->value.len = value.size();
  ngx_key_value->value.data =
      reinterpret_cast<u_char *>(ngx_palloc(pool, value.size()));
  ngx_copy(ngx_key_value->value.data, value.data(), value.size());
  ngx_key_value->lowcase_key =
      reinterpret_cast<u_char *>(ngx_pnalloc(pool, ngx_key_value->key.len));
  ngx_strlow(ngx_key_value->lowcase_key, ngx_key_value->key.data,
             ngx_key_value->key.len);
  ngx_key_value->hash =
      ngx_hash_key_lc(ngx_key_value->key.data, ngx_key_value->key.len);
}
}  // namespace

void AddHTTPHeader(ngx_http_request_t *http_request, const string &name,
                   const string_ref &value) {
  AddElementToNginxElementTable(
      http_request->pool, &http_request->headers_out.headers, name, value);
}

void AddHTTPTrailer(ngx_http_request_t *http_request, const string &name,
                    const string_ref &value) {
  AddElementToNginxElementTable(
      http_request->pool, &http_request->headers_out.trailers, name, value);
}
}  // namespace gateway
}  // namespace grpc
