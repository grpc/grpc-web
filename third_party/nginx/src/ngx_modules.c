
/*
 * Copyright (C) Google Inc.
 */


#include <ngx_config.h>
#include <ngx_core.h>
#include <ngx_modules.h>


extern ngx_module_t  ngx_core_module;
extern ngx_module_t  ngx_errlog_module;
extern ngx_module_t  ngx_conf_module;
#if (NGX_SSL)
extern ngx_module_t  ngx_openssl_module;
#endif
#if (NGX_PCRE)
extern ngx_module_t  ngx_regex_module;
#endif
extern ngx_module_t  ngx_events_module;
extern ngx_module_t  ngx_event_core_module;
#if (NGX_HAVE_EPOLL)
extern ngx_module_t  ngx_epoll_module;
#endif
#if (NGX_HAVE_KQUEUE)
extern ngx_module_t  ngx_kqueue_module;
#endif
#if (NGX_HAVE_SELECT)
extern ngx_module_t  ngx_select_module;
#endif
#if (NGX_HAVE_POLL)
extern ngx_module_t  ngx_poll_module;
#endif
#if (NGX_THREADS)
extern ngx_module_t  ngx_thread_pool_module;
#endif

#if (NGX_HTTP)
extern ngx_module_t  ngx_http_module;
extern ngx_module_t  ngx_http_core_module;
extern ngx_module_t  ngx_http_log_module;
extern ngx_module_t  ngx_http_upstream_module;
#endif
#if (NGX_HTTP_V2)
extern ngx_module_t  ngx_http_v2_module;
#endif
#if (NGX_HTTP)
extern ngx_module_t  ngx_http_static_module;
#endif
#if (NGX_HTTP_GZIP_STATIC)
extern ngx_module_t  ngx_http_gzip_static_module;
#endif
#if (NGX_HTTP_BROTLI_STATIC)
extern ngx_module_t  ngx_http_brotli_static_module;
#endif
#if (NGX_HTTP_DAV)
extern ngx_module_t  ngx_http_dav_module;
#endif
#if (NGX_HTTP_AUTOINDEX)
extern ngx_module_t  ngx_http_autoindex_module;
#endif
#if (NGX_HTTP)
extern ngx_module_t  ngx_http_index_module;
#endif
#if (NGX_HTTP_RANDOM_INDEX)
extern ngx_module_t  ngx_http_random_index_module;
#endif
#if (NGX_HTTP_AUTH_REQUEST)
extern ngx_module_t  ngx_http_auth_request_module;
#endif
#if (NGX_HTTP_AUTH_BASIC)
extern ngx_module_t  ngx_http_auth_basic_module;
#endif
#if (NGX_HTTP_ACCESS)
extern ngx_module_t  ngx_http_access_module;
#endif
#if (NGX_HTTP_LIMIT_CONN)
extern ngx_module_t  ngx_http_limit_conn_module;
#endif
#if (NGX_HTTP_LIMIT_REQ)
extern ngx_module_t  ngx_http_limit_req_module;
#endif
#if (NGX_HTTP_REALIP)
extern ngx_module_t  ngx_http_realip_module;
#endif
#if (NGX_HTTP_GEO)
extern ngx_module_t  ngx_http_geo_module;
#endif
#if 0
extern ngx_module_t  ngx_http_geoip_module;
#endif
#if (NGX_HTTP_MAP)
extern ngx_module_t  ngx_http_map_module;
#endif
#if (NGX_HTTP_SPLIT_CLIENTS)
extern ngx_module_t  ngx_http_split_clients_module;
#endif
#if (NGX_HTTP_REFERER)
extern ngx_module_t  ngx_http_referer_module;
#endif
#if (NGX_HTTP_REWRITE)
extern ngx_module_t  ngx_http_rewrite_module;
#endif
#if (NGX_HTTP_SSL)
extern ngx_module_t  ngx_http_ssl_module;
#endif
#if (NGX_HTTP_PROXY)
extern ngx_module_t  ngx_http_proxy_module;
#endif
#if (NGX_HTTP_FASTCGI)
extern ngx_module_t  ngx_http_fastcgi_module;
#endif
#if (NGX_HTTP_UWSGI)
extern ngx_module_t  ngx_http_uwsgi_module;
#endif
#if (NGX_HTTP_SCGI)
extern ngx_module_t  ngx_http_scgi_module;
#endif
#if 0
extern ngx_module_t  ngx_http_perl_module;
#endif
#if (NGX_HTTP_MEMCACHED)
extern ngx_module_t  ngx_http_memcached_module;
#endif
#if (NGX_HTTP_EMPTY_GIF)
extern ngx_module_t  ngx_http_empty_gif_module;
#endif
#if (NGX_HTTP_BROWSER)
extern ngx_module_t  ngx_http_browser_module;
#endif
#if (NGX_HTTP_SECURE_LINK)
extern ngx_module_t  ngx_http_secure_link_module;
#endif
#if 0
extern ngx_module_t  ngx_http_degradation_module;
#endif
#if (NGX_HTTP_FLV)
extern ngx_module_t  ngx_http_flv_module;
#endif
#if (NGX_HTTP_MP4)
extern ngx_module_t  ngx_http_mp4_module;
#endif
#if (NGX_HTTP_UPSTREAM_HASH)
extern ngx_module_t  ngx_http_upstream_hash_module;
#endif
#if (NGX_HTTP_UPSTREAM_IP_HASH)
extern ngx_module_t  ngx_http_upstream_ip_hash_module;
#endif
#if (NGX_HTTP_UPSTREAM_LEAST_CONN)
extern ngx_module_t  ngx_http_upstream_least_conn_module;
#endif
#if (NGX_HTTP_UPSTREAM_KEEPALIVE)
extern ngx_module_t  ngx_http_upstream_keepalive_module;
#endif
#if (NGX_HTTP_UPSTREAM_ZONE)
extern ngx_module_t  ngx_http_upstream_zone_module;
#endif
#if (NGX_HTTP_STUB_STATUS)
extern ngx_module_t  ngx_http_stub_status_module;
#endif
#if (NGX_HTTP_GRPC_GATEWAY)
extern ngx_module_t  grpc_gateway_module;
#endif
#if (NGX_HTTP_HELLO_WORLD)
extern ngx_module_t  ngx_http_hello_world_module;
#endif
#if (NGX_HTTP)
extern ngx_module_t  ngx_http_write_filter_module;
extern ngx_module_t  ngx_http_header_filter_module;
extern ngx_module_t  ngx_http_chunked_filter_module;
#endif
#if (NGX_HTTP_V2)
extern ngx_module_t  ngx_http_v2_filter_module;
#endif
#if (NGX_HTTP)
extern ngx_module_t  ngx_http_range_header_filter_module;
#endif
#if (NGX_HTTP_GZIP_FILTER)
extern ngx_module_t  ngx_http_gzip_filter_module;
#endif
#if (NGX_HTTP_BROTLI_FILTER)
extern ngx_module_t  ngx_http_brotli_filter_module;
#endif
#if (NGX_HTTP_POSTPONE)
extern ngx_module_t  ngx_http_postpone_filter_module;
#endif
#if (NGX_HTTP_SSI)
extern ngx_module_t  ngx_http_ssi_filter_module;
#endif
#if (NGX_HTTP_CHARSET)
extern ngx_module_t  ngx_http_charset_filter_module;
#endif
#if 0
extern ngx_module_t  ngx_http_xslt_filter_module;
extern ngx_module_t  ngx_http_image_filter_module;
#endif
#if (NGX_HTTP_SUB)
extern ngx_module_t  ngx_http_sub_filter_module;
#endif
#if (NGX_HTTP_ADDITION)
extern ngx_module_t  ngx_http_addition_filter_module;
#endif
#if (NGX_HTTP_GUNZIP)
extern ngx_module_t  ngx_http_gunzip_filter_module;
#endif
#if (NGX_HTTP_USERID)
extern ngx_module_t  ngx_http_userid_filter_module;
#endif
#if (NGX_HTTP)
extern ngx_module_t  ngx_http_headers_filter_module;
extern ngx_module_t  ngx_http_copy_filter_module;
extern ngx_module_t  ngx_http_range_body_filter_module;
extern ngx_module_t  ngx_http_not_modified_filter_module;
#endif
#if (NGX_HTTP_SLICE)
extern ngx_module_t  ngx_http_slice_filter_module;
#endif

#if (NGX_MAIL)
extern ngx_module_t  ngx_mail_module;
extern ngx_module_t  ngx_mail_core_module;
#endif
#if (NGX_MAIL_SSL)
extern ngx_module_t  ngx_mail_ssl_module;
#endif
#if (NGX_MAIL_POP3)
extern ngx_module_t  ngx_mail_pop3_module;
#endif
#if (NGX_MAIL_IMAP)
extern ngx_module_t  ngx_mail_imap_module;
#endif
#if (NGX_MAIL_SMTP)
extern ngx_module_t  ngx_mail_smtp_module;
#endif
#if (NGX_MAIL)
extern ngx_module_t  ngx_mail_auth_http_module;
extern ngx_module_t  ngx_mail_proxy_module;
#endif

#if (NGX_STREAM)
extern ngx_module_t  ngx_stream_module;
extern ngx_module_t  ngx_stream_core_module;
extern ngx_module_t  ngx_stream_proxy_module;
extern ngx_module_t  ngx_stream_upstream_module;
#endif
#if (NGX_STREAM_SSL)
extern ngx_module_t  ngx_stream_ssl_module;
#endif
#if (NGX_STREAM_LIMIT_CONN)
extern ngx_module_t  ngx_stream_limit_conn_module;
#endif
#if (NGX_STREAM_ACCESS)
extern ngx_module_t  ngx_stream_access_module;
#endif
#if (NGX_STREAM_UPSTREAM_HASH)
extern ngx_module_t  ngx_stream_upstream_hash_module;
#endif
#if (NGX_STREAM_UPSTREAM_LEAST_CONN)
extern ngx_module_t  ngx_stream_upstream_least_conn_module;
#endif
#if (NGX_STREAM_UPSTREAM_ZONE)
extern ngx_module_t  ngx_stream_upstream_zone_module;
#endif

#if 0
extern ngx_module_t  ngx_google_perftools_module;
#endif


ngx_module_t *ngx_modules[] = {
    &ngx_core_module,
    &ngx_errlog_module,
    &ngx_conf_module,
#if (NGX_SSL)
    &ngx_openssl_module,
#endif
#if (NGX_PCRE)
    &ngx_regex_module,
#endif
    &ngx_events_module,
    &ngx_event_core_module,
#if (NGX_HAVE_EPOLL)
    &ngx_epoll_module,
#endif
#if (NGX_HAVE_KQUEUE)
    &ngx_kqueue_module,
#endif
#if (NGX_HAVE_SELECT)
    &ngx_select_module,
#endif
#if (NGX_HAVE_POLL)
    &ngx_poll_module,
#endif
#if (NGX_THREADS)
    &ngx_thread_pool_module,
#endif

#if (NGX_HTTP)
    &ngx_http_module,
    &ngx_http_core_module,
    &ngx_http_log_module,
    &ngx_http_upstream_module,
#endif
#if (NGX_HTTP_V2)
    &ngx_http_v2_module,
#endif
#if (NGX_HTTP)
    &ngx_http_static_module,
#endif
#if (NGX_HTTP_GZIP_STATIC)
    &ngx_http_gzip_static_module,
#endif
#if (NGX_HTTP_BROTLI_STATIC)
    &ngx_http_brotli_static_module,
#endif
#if (NGX_HTTP_DAV)
    &ngx_http_dav_module,
#endif
#if (NGX_HTTP_AUTOINDEX)
    &ngx_http_autoindex_module,
#endif
#if (NGX_HTTP)
    &ngx_http_index_module,
#endif
#if (NGX_HTTP_RANDOM_INDEX)
    &ngx_http_random_index_module,
#endif
#if (NGX_HTTP_AUTH_REQUEST)
    &ngx_http_auth_request_module,
#endif
#if (NGX_HTTP_AUTH_BASIC)
    &ngx_http_auth_basic_module,
#endif
#if (NGX_HTTP_ACCESS)
    &ngx_http_access_module,
#endif
#if (NGX_HTTP_LIMIT_CONN)
    &ngx_http_limit_conn_module,
#endif
#if (NGX_HTTP_LIMIT_REQ)
    &ngx_http_limit_req_module,
#endif
#if (NGX_HTTP_REALIP)
    &ngx_http_realip_module,
#endif
#if (NGX_HTTP_GEO)
    &ngx_http_geo_module,
#endif
#if 0
    &ngx_http_geoip_module,
#endif
#if (NGX_HTTP_MAP)
    &ngx_http_map_module,
#endif
#if (NGX_HTTP_SPLIT_CLIENTS)
    &ngx_http_split_clients_module,
#endif
#if (NGX_HTTP_REFERER)
    &ngx_http_referer_module,
#endif
#if (NGX_HTTP_REWRITE)
    &ngx_http_rewrite_module,
#endif
#if (NGX_HTTP_SSL)
    &ngx_http_ssl_module,
#endif
#if (NGX_HTTP_PROXY)
    &ngx_http_proxy_module,
#endif
#if (NGX_HTTP_FASTCGI)
    &ngx_http_fastcgi_module,
#endif
#if (NGX_HTTP_UWSGI)
    &ngx_http_uwsgi_module,
#endif
#if (NGX_HTTP_SCGI)
    &ngx_http_scgi_module,
#endif
#if 0
    &ngx_http_perl_module,
#endif
#if (NGX_HTTP_MEMCACHED)
    &ngx_http_memcached_module,
#endif
#if (NGX_HTTP_EMPTY_GIF)
    &ngx_http_empty_gif_module,
#endif
#if (NGX_HTTP_BROWSER)
    &ngx_http_browser_module,
#endif
#if (NGX_HTTP_SECURE_LINK)
    &ngx_http_secure_link_module,
#endif
#if 0
    &ngx_http_degradation_module,
#endif
#if (NGX_HTTP_FLV)
    &ngx_http_flv_module,
#endif
#if (NGX_HTTP_MP4)
    &ngx_http_mp4_module,
#endif
#if (NGX_HTTP_UPSTREAM_HASH)
    &ngx_http_upstream_hash_module,
#endif
#if (NGX_HTTP_UPSTREAM_IP_HASH)
    &ngx_http_upstream_ip_hash_module,
#endif
#if (NGX_HTTP_UPSTREAM_LEAST_CONN)
    &ngx_http_upstream_least_conn_module,
#endif
#if (NGX_HTTP_UPSTREAM_KEEPALIVE)
    &ngx_http_upstream_keepalive_module,
#endif
#if (NGX_HTTP_UPSTREAM_ZONE)
    &ngx_http_upstream_zone_module,
#endif
#if (NGX_HTTP_STUB_STATUS)
    &ngx_http_stub_status_module,
#endif
#if (NGX_HTTP_GRPC_GATEWAY)
    &grpc_gateway_module,
#endif
#if (NGX_HTTP_HELLO_WORLD)
    &ngx_http_hello_world_module,
#endif
#if (NGX_HTTP)
    &ngx_http_write_filter_module,
    &ngx_http_header_filter_module,
    &ngx_http_chunked_filter_module,
#endif
#if (NGX_HTTP_V2)
    &ngx_http_v2_filter_module,
#endif
#if (NGX_HTTP)
    &ngx_http_range_header_filter_module,
#endif
#if (NGX_HTTP_GZIP_FILTER)
    &ngx_http_gzip_filter_module,
#endif
#if (NGX_HTTP_BROTLI_FILTER)
    &ngx_http_brotli_filter_module,
#endif
#if (NGX_HTTP_POSTPONE)
    &ngx_http_postpone_filter_module,
#endif
#if (NGX_HTTP_SSI)
    &ngx_http_ssi_filter_module,
#endif
#if (NGX_HTTP_CHARSET)
    &ngx_http_charset_filter_module,
#endif
#if 0
    &ngx_http_xslt_filter_module,
    &ngx_http_image_filter_module,
#endif
#if (NGX_HTTP_SUB)
    &ngx_http_sub_filter_module,
#endif
#if (NGX_HTTP_ADDITION)
    &ngx_http_addition_filter_module,
#endif
#if (NGX_HTTP_GUNZIP)
    &ngx_http_gunzip_filter_module,
#endif
#if (NGX_HTTP_USERID)
    &ngx_http_userid_filter_module,
#endif
#if (NGX_HTTP)
    &ngx_http_headers_filter_module,
    &ngx_http_copy_filter_module,
    &ngx_http_range_body_filter_module,
    &ngx_http_not_modified_filter_module,
#endif
#if (NGX_HTTP_SLICE)
    &ngx_http_slice_filter_module,
#endif

#if (NGX_MAIL)
    &ngx_mail_module,
    &ngx_mail_core_module,
#endif
#if (NGX_MAIL_SSL)
    &ngx_mail_ssl_module,
#endif
#if (NGX_MAIL_POP3)
    &ngx_mail_pop3_module,
#endif
#if (NGX_MAIL_IMAP)
    &ngx_mail_imap_module,
#endif
#if (NGX_MAIL_SMTP)
    &ngx_mail_smtp_module,
#endif
#if (NGX_MAIL)
    &ngx_mail_auth_http_module,
    &ngx_mail_proxy_module,
#endif

#if (NGX_STREAM)
    &ngx_stream_module,
    &ngx_stream_core_module,
    &ngx_stream_proxy_module,
    &ngx_stream_upstream_module,
#endif
#if (NGX_STREAM_SSL)
    &ngx_stream_ssl_module,
#endif
#if (NGX_STREAM_LIMIT_CONN)
    &ngx_stream_limit_conn_module,
#endif
#if (NGX_STREAM_ACCESS)
    &ngx_stream_access_module,
#endif
#if (NGX_STREAM_UPSTREAM_HASH)
    &ngx_stream_upstream_hash_module,
#endif
#if (NGX_STREAM_UPSTREAM_LEAST_CONN)
    &ngx_stream_upstream_least_conn_module,
#endif
#if (NGX_STREAM_UPSTREAM_ZONE)
    &ngx_stream_upstream_zone_module,
#endif

#if 0
    &ngx_google_perftools_module,
#endif
    NULL
};


char *ngx_module_names[] = {
    "ngx_core_module",
    "ngx_errlog_module",
    "ngx_conf_module",
#if (NGX_SSL)
    "ngx_openssl_module",
#endif
#if (NGX_PCRE)
    "ngx_regex_module",
#endif
    "ngx_events_module",
    "ngx_event_core_module",
#if (NGX_HAVE_EPOLL)
    "ngx_epoll_module",
#endif
#if (NGX_HAVE_KQUEUE)
    "ngx_kqueue_module",
#endif
#if (NGX_HAVE_SELECT)
    "ngx_select_module",
#endif
#if (NGX_HAVE_POLL)
    "ngx_poll_module",
#endif
#if (NGX_THREADS)
    "ngx_thread_pool_module",
#endif

#if (NGX_HTTP)
    "ngx_http_module",
    "ngx_http_core_module",
    "ngx_http_log_module",
    "ngx_http_upstream_module",
#endif
#if (NGX_HTTP_V2)
    "ngx_http_v2_module",
#endif
#if (NGX_HTTP)
    "ngx_http_static_module",
#endif
#if (NGX_HTTP_GZIP_STATIC)
    "ngx_http_gzip_static_module",
#endif
#if (NGX_HTTP_BROTLI_STATIC)
    "ngx_http_brotli_static_module",
#endif
#if (NGX_HTTP_DAV)
    "ngx_http_dav_module",
#endif
#if (NGX_HTTP_AUTOINDEX)
    "ngx_http_autoindex_module",
#endif
#if (NGX_HTTP)
    "ngx_http_index_module",
#endif
#if (NGX_HTTP_RANDOM_INDEX)
    "ngx_http_random_index_module",
#endif
#if (NGX_HTTP_AUTH_REQUEST)
    "ngx_http_auth_request_module",
#endif
#if (NGX_HTTP_AUTH_BASIC)
    "ngx_http_auth_basic_module",
#endif
#if (NGX_HTTP_ACCESS)
    "ngx_http_access_module",
#endif
#if (NGX_HTTP_LIMIT_CONN)
    "ngx_http_limit_conn_module",
#endif
#if (NGX_HTTP_LIMIT_REQ)
    "ngx_http_limit_req_module",
#endif
#if (NGX_HTTP_REALIP)
    "ngx_http_realip_module",
#endif
#if (NGX_HTTP_GEO)
    "ngx_http_geo_module",
#endif
#if 0
    "ngx_http_geoip_module",
#endif
#if (NGX_HTTP_MAP)
    "ngx_http_map_module",
#endif
#if (NGX_HTTP_SPLIT_CLIENTS)
    "ngx_http_split_clients_module",
#endif
#if (NGX_HTTP_REFERER)
    "ngx_http_referer_module",
#endif
#if (NGX_HTTP_REWRITE)
    "ngx_http_rewrite_module",
#endif
#if (NGX_HTTP_SSL)
    "ngx_http_ssl_module",
#endif
#if (NGX_HTTP_PROXY)
    "ngx_http_proxy_module",
#endif
#if (NGX_HTTP_FASTCGI)
    "ngx_http_fastcgi_module",
#endif
#if (NGX_HTTP_UWSGI)
    "ngx_http_uwsgi_module",
#endif
#if (NGX_HTTP_SCGI)
    "ngx_http_scgi_module",
#endif
#if 0
    "ngx_http_perl_module",
#endif
#if (NGX_HTTP_MEMCACHED)
    "ngx_http_memcached_module",
#endif
#if (NGX_HTTP_EMPTY_GIF)
    "ngx_http_empty_gif_module",
#endif
#if (NGX_HTTP_BROWSER)
    "ngx_http_browser_module",
#endif
#if (NGX_HTTP_SECURE_LINK)
    "ngx_http_secure_link_module",
#endif
#if 0
    "ngx_http_degradation_module",
#endif
#if (NGX_HTTP_FLV)
    "ngx_http_flv_module",
#endif
#if (NGX_HTTP_MP4)
    "ngx_http_mp4_module",
#endif
#if (NGX_HTTP_UPSTREAM_HASH)
    "ngx_http_upstream_hash_module",
#endif
#if (NGX_HTTP_UPSTREAM_IP_HASH)
    "ngx_http_upstream_ip_hash_module",
#endif
#if (NGX_HTTP_UPSTREAM_LEAST_CONN)
    "ngx_http_upstream_least_conn_module",
#endif
#if (NGX_HTTP_UPSTREAM_KEEPALIVE)
    "ngx_http_upstream_keepalive_module",
#endif
#if (NGX_HTTP_UPSTREAM_ZONE)
    "ngx_http_upstream_zone_module",
#endif
#if (NGX_HTTP_STUB_STATUS)
    "ngx_http_stub_status_module",
#endif
#if (NGX_HTTP)
    "ngx_http_write_filter_module",
    "ngx_http_header_filter_module",
    "ngx_http_chunked_filter_module",
#endif
#if (NGX_HTTP_V2)
    "ngx_http_v2_filter_module",
#endif
#if (NGX_HTTP)
    "ngx_http_range_header_filter_module",
#endif
#if (NGX_HTTP_GZIP_FILTER)
    "ngx_http_gzip_filter_module",
#endif
#if (NGX_HTTP_BROTLI_FILTER)
    "ngx_http_brotli_filter_module",
#endif
#if (NGX_HTTP_POSTPONE)
    "ngx_http_postpone_filter_module",
#endif
#if (NGX_HTTP_SSI)
    "ngx_http_ssi_filter_module",
#endif
#if (NGX_HTTP_CHARSET)
    "ngx_http_charset_filter_module",
#endif
#if 0
    "ngx_http_xslt_filter_module",
    "ngx_http_image_filter_module",
#endif
#if (NGX_HTTP_SUB)
    "ngx_http_sub_filter_module",
#endif
#if (NGX_HTTP_ADDITION)
    "ngx_http_addition_filter_module",
#endif
#if (NGX_HTTP_GUNZIP)
    "ngx_http_gunzip_filter_module",
#endif
#if (NGX_HTTP_USERID)
    "ngx_http_userid_filter_module",
#endif
#if (NGX_HTTP)
    "ngx_http_headers_filter_module",
    "ngx_http_copy_filter_module",
    "ngx_http_range_body_filter_module",
    "ngx_http_not_modified_filter_module",
#endif
#if (NGX_HTTP_SLICE)
    "ngx_http_slice_filter_module",
#endif

#if (NGX_MAIL)
    "ngx_mail_module",
    "ngx_mail_core_module",
#endif
#if (NGX_MAIL_SSL)
    "ngx_mail_ssl_module",
#endif
#if (NGX_MAIL_POP3)
    "ngx_mail_pop3_module",
#endif
#if (NGX_MAIL_IMAP)
    "ngx_mail_imap_module",
#endif
#if (NGX_MAIL_SMTP)
    "ngx_mail_smtp_module",
#endif
#if (NGX_MAIL)
    "ngx_mail_auth_http_module",
    "ngx_mail_proxy_module",
#endif

#if (NGX_STREAM)
    "ngx_stream_module",
    "ngx_stream_core_module",
    "ngx_stream_proxy_module",
    "ngx_stream_upstream_module",
#endif
#if (NGX_STREAM_SSL)
    "ngx_stream_ssl_module",
#endif
#if (NGX_STREAM_LIMIT_CONN)
    "ngx_stream_limit_conn_module",
#endif
#if (NGX_STREAM_ACCESS)
    "ngx_stream_access_module",
#endif
#if (NGX_STREAM_UPSTREAM_HASH)
    "ngx_stream_upstream_hash_module",
#endif
#if (NGX_STREAM_UPSTREAM_LEAST_CONN)
    "ngx_stream_upstream_least_conn_module",
#endif
#if (NGX_STREAM_UPSTREAM_ZONE)
    "ngx_stream_upstream_zone_module",
#endif

#if 0
    "ngx_google_perftools_module",
#endif
    NULL
};


void
ngx_show_configure_options(void)
{
    ngx_write_stderr("configure arguments:");

#ifdef NGX_PREFIX
    ngx_write_stderr(" --prefix=");
    (void) ngx_write_fd(ngx_stderr, NGX_PREFIX, ngx_strlen(NGX_PREFIX) - 1);
#endif
#ifdef NGX_CONF_PATH
    ngx_write_stderr(" --conf-path=" NGX_CONF_PATH);
#endif
#ifdef NGX_ERROR_LOG_PATH
    ngx_write_stderr(" --error-log-path=" NGX_ERROR_LOG_PATH);
#endif
#ifdef NGX_PID_PATH
    ngx_write_stderr(" --pid-path=" NGX_PID_PATH);
#endif
#ifdef NGX_LOCK_PATH
    ngx_write_stderr(" --lock-path=" NGX_LOCK_PATH);
#endif
#ifdef NGX_USER
    ngx_write_stderr(" --user=" NGX_USER);
#endif
#ifdef NGX_GROUP
    ngx_write_stderr(" --group=" NGX_GROUP);
#endif

#if (NGX_HTTP)
#ifdef NGX_HTTP_LOG_PATH
    ngx_write_stderr(" --http-log-path=" NGX_HTTP_LOG_PATH);
#endif
#ifdef NGX_HTTP_CLIENT_TEMP_PATH
    ngx_write_stderr(" --http-client-body-temp-path="
                     NGX_HTTP_CLIENT_TEMP_PATH);
#endif
#ifdef NGX_HTTP_FASTCGI_TEMP_PATH
    ngx_write_stderr(" --http-fastcgi-temp-path=" NGX_HTTP_FASTCGI_TEMP_PATH);
#endif
#ifdef NGX_HTTP_PROXY_TEMP_PATH
    ngx_write_stderr(" --http-proxy-temp-path=" NGX_HTTP_PROXY_TEMP_PATH);
#endif
#ifdef NGX_HTTP_SCGI_TEMP_PATH
    ngx_write_stderr(" --http-scgi-temp-path=" NGX_HTTP_SCGI_TEMP_PATH);
#endif
#ifdef NGX_HTTP_UWSGI_TEMP_PATH
    ngx_write_stderr(" --http-uwsgi-temp-path=" NGX_HTTP_UWSGI_TEMP_PATH);
#endif
#endif

#if (NGX_DEBUG)
    ngx_write_stderr(" --with-debug");
#endif
#if (NGX_HAVE_FILE_AIO)
    ngx_write_stderr(" --with-file-aio");
#endif
#if (NGX_HAVE_INET6)
    ngx_write_stderr(" --with-ipv6");
#endif
#if (NGX_THREADS)
    ngx_write_stderr(" --with-threads");
#endif
#if (NGX_HAVE_POLL)
    ngx_write_stderr(" --with-poll_module");
#endif
#if (NGX_HAVE_SELECT)
    ngx_write_stderr(" --with-select_module");
#endif

#if (NGX_HTTP)
#if (NGX_HTTP_ADDITION)
    ngx_write_stderr(" --with-http_addition_module");
#endif
#if (NGX_HTTP_AUTH_REQUEST)
    ngx_write_stderr(" --with-http_auth_request_module");
#endif
#if (NGX_HTTP_DAV)
    ngx_write_stderr(" --with-http_dav_module");
#endif
#if 0
    ngx_write_stderr(" --with-http_degradation_module");
#endif
#if (NGX_HTTP_FLV)
    ngx_write_stderr(" --with-http_flv_module");
#endif
#if 0
    ngx_write_stderr(" --with-http_geoip_module");
#endif
#if (NGX_HTTP_GUNZIP)
    ngx_write_stderr(" --with-http_gunzip_module");
#endif
#if (NGX_HTTP_GZIP_STATIC)
    ngx_write_stderr(" --with-http_gzip_static_module");
#endif
#if 0
    ngx_write_stderr(" --with-http_image_filter_module");
#endif
#if (NGX_HTTP_MP4)
    ngx_write_stderr(" --with-http_mp4_module");
#endif
#if 0
    ngx_write_stderr(" --with-http_perl_module");
#endif
#if (NGX_HTTP_RANDOM_INDEX)
    ngx_write_stderr(" --with-http_random_index_module");
#endif
#if (NGX_HTTP_REALIP)
    ngx_write_stderr(" --with-http_realip_module");
#endif
#if (NGX_HTTP_SECURE_LINK)
    ngx_write_stderr(" --with-http_secure_link_module");
#endif
#if (NGX_HTTP_SLICE)
    ngx_write_stderr(" --with-http_slice_module");
#endif
#if (NGX_HTTP_SSL)
    ngx_write_stderr(" --with-http_ssl_module");
#endif
#if (NGX_HTTP_STUB_STATUS)
    ngx_write_stderr(" --with-http_stub_status_module");
#endif
#if (NGX_HTTP_SUB)
    ngx_write_stderr(" --with-http_sub_module");
#endif
#if (NGX_HTTP_V2)
    ngx_write_stderr(" --with-http_v2_module");
#endif
#if 0
    ngx_write_stderr(" --with-http_xslt_module");
#endif
#if !(NGX_HTTP_ACCESS)
    ngx_write_stderr(" --without-http_access_module");
#endif
#if !(NGX_HTTP_AUTH_BASIC)
    ngx_write_stderr(" --without-http_auth_basic_module");
#endif
#if !(NGX_HTTP_AUTOINDEX)
    ngx_write_stderr(" --without-http_autoindex_module");
#endif
#if !(NGX_HTTP_BROWSER)
    ngx_write_stderr(" --without-http_browser_module");
#endif
#if !(NGX_HTTP_CACHE)
    ngx_write_stderr(" --without-http-cache");
#endif
#if !(NGX_HTTP_CHARSET)
    ngx_write_stderr(" --without-http_charset_module");
#endif
#if !(NGX_HTTP_EMPTY_GIF)
    ngx_write_stderr(" --without-http_empty_gif_module");
#endif
#if !(NGX_HTTP_FASTCGI)
    ngx_write_stderr(" --without-http_fastcgi_module");
#endif
#if !(NGX_HTTP_GEO)
    ngx_write_stderr(" --without-http_geo_module");
#endif
#if !(NGX_HTTP_GZIP_FILTER)
    ngx_write_stderr(" --without-http_gzip_module");
#endif
#if !(NGX_HTTP_LIMIT_CONN)
    ngx_write_stderr(" --without-http_limit_conn_module");
#endif
#if !(NGX_HTTP_LIMIT_REQ)
    ngx_write_stderr(" --without-http_limit_req_module");
#endif
#if !(NGX_HTTP_MAP)
    ngx_write_stderr(" --without-http_map_module");
#endif
#if !(NGX_HTTP_MEMCACHED)
    ngx_write_stderr(" --without-http_memcached_module");
#endif
#if !(NGX_HTTP_PROXY)
    ngx_write_stderr(" --without-http_proxy_module");
#endif
#if !(NGX_HTTP_REFERER)
    ngx_write_stderr(" --without-http_referer_module");
#endif
#if !(NGX_HTTP_REWRITE)
    ngx_write_stderr(" --without-http_rewrite_module");
#endif
#if !(NGX_HTTP_SCGI)
    ngx_write_stderr(" --without-http_scgi_module");
#endif
#if !(NGX_HTTP_SPLIT_CLIENTS)
    ngx_write_stderr(" --without-http_split_clients_module");
#endif
#if !(NGX_HTTP_SSI)
    ngx_write_stderr(" --without-http_ssi_module");
#endif
#if !(NGX_HTTP_UPSTREAM_HASH)
    ngx_write_stderr(" --without-http_upstream_hash_module");
#endif
#if !(NGX_HTTP_UPSTREAM_IP_HASH)
    ngx_write_stderr(" --without-http_upstream_ip_hash_module");
#endif
#if !(NGX_HTTP_UPSTREAM_KEEPALIVE)
    ngx_write_stderr(" --without-http_upstream_keepalive_module");
#endif
#if !(NGX_HTTP_UPSTREAM_LEAST_CONN)
    ngx_write_stderr(" --without-http_upstream_least_conn_module");
#endif
#if !(NGX_HTTP_UPSTREAM_ZONE)
    ngx_write_stderr(" --without-http_upstream_zone_module");
#endif
#if !(NGX_HTTP_USERID)
    ngx_write_stderr(" --without-http_userid_module");
#endif
#if !(NGX_HTTP_UWSGI)
    ngx_write_stderr(" --without-http_uwsgi_module");
#endif
#else
    ngx_write_stderr(" --without-http");
#endif

#if (NGX_MAIL)
    ngx_write_stderr(" --with-mail");
#if (NGX_MAIL_SSL)
    ngx_write_stderr(" --with-mail_ssl_module");
#endif
#if !(NGX_MAIL_IMAP)
    ngx_write_stderr(" --without-mail_imap_module");
#endif
#if !(NGX_MAIL_POP3)
    ngx_write_stderr(" --without-mail_pop3_module");
#endif
#if !(NGX_MAIL_SMTP)
    ngx_write_stderr(" --without-mail_smtp_module");
#endif
#endif

#if (NGX_STREAM)
    ngx_write_stderr(" --with-stream");
#if (NGX_STREAM_SSL)
    ngx_write_stderr(" --with-stream_ssl_module");
#endif
#if !(NGX_STREAM_ACCESS)
    ngx_write_stderr(" --without-stream_access_module");
#endif
#if !(NGX_STREAM_LIMIT_CONN)
    ngx_write_stderr(" --without-stream_limit_conn_module");
#endif
#if !(NGX_STREAM_UPSTREAM_HASH)
    ngx_write_stderr(" --without-stream_upstream_hash_module");
#endif
#if !(NGX_STREAM_UPSTREAM_LEAST_CONN)
    ngx_write_stderr(" --without-stream_upstream_least_conn_module");
#endif
#if !(NGX_STREAM_UPSTREAM_ZONE)
    ngx_write_stderr(" --without-stream_upstream_zone_module");
#endif
#endif

#if 0
    ngx_write_stderr(" --with-google_perftools_module");
#endif

#if (NGX_SSL)
    ngx_write_stderr(" --with-openssl=//external:boringssl");
#endif
#if (NGX_PCRE)
    ngx_write_stderr(" --with-pcre=//external:pcre");
    ngx_write_stderr(" --with-pcre-jit");
#endif
#if (NGX_ZLIB)
    ngx_write_stderr(" --with-zlib=//external:zlib");
#endif

#if (NGX_HTTP_BROTLI_FILTER)
    ngx_write_stderr(" --add-module=//ngx_brotli:http_brotli_filter");
#endif
#if (NGX_HTTP_BROTLI_STATIC)
    ngx_write_stderr(" --add-module=//ngx_brotli:http_brotli_static");
#endif
#if (NGX_HTTP_GRPC_GATEWAY)
    ngx_write_stderr(" --add-module=//net/grpc/gateway/nginx");
#endif
#if (NGX_HTTP_HELLO_WORLD)
    ngx_write_stderr(" --add-module="
        "//third_party/helloworld_nginx_module:hello_world");
#endif

    ngx_write_stderr(NGX_LINEFEED);
}
