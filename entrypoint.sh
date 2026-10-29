#!/bin/bash

# With MATOMO_MODE=proxied, serve the Matomo tracker from this app's own origin, at paths
# ad blockers don't recognize: no "matomo" or "piwik" in the path, and no .php extension
# (EasyPrivacy blocks *.php?action_name=). Hits keep the visitor's IP in X-Forwarded-For.
mkdir -p /etc/nginx/matomo-proxy
rm -f /etc/nginx/matomo-proxy/*.conf
if [ "$MATOMO_MODE" = "proxied" ]; then
  upstream="${MATOMO_UPSTREAM:-http://matomo.matomo.svc.cluster.local}"
  cat > /etc/nginx/matomo-proxy/locations.conf <<CONF
location = /px/s.js {
    proxy_pass ${upstream}/matomo.js;
    proxy_ssl_server_name on;
}
location = /px/h {
    proxy_pass ${upstream}/matomo.php;
    proxy_ssl_server_name on;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
}
CONF
fi

envsubst < /usr/share/nginx/html/assets/config/envvars.tpl.json > /usr/share/nginx/html/assets/config/envvars.json && exec nginx -g 'daemon off;'
