FROM kong:2.8

USER root

# Install build dependencies for Alpine
RUN apk update && apk add --no-cache \
    git \
    unzip

# Install all lua-resty dependencies manually from GitHub
# We manually copy files instead of using luarocks make to avoid dependency detection issues

# 1. Install lua-resty-http
RUN git clone https://github.com/ledgetech/lua-resty-http.git /tmp/lua-resty-http && \
    cp -r /tmp/lua-resty-http/lib/resty/* /usr/local/share/lua/5.1/resty/ && \
    rm -rf /tmp/lua-resty-http

# 2. Install lua-resty-jwt
RUN git clone https://github.com/SkyLothar/lua-resty-jwt.git /tmp/lua-resty-jwt && \
    cp -r /tmp/lua-resty-jwt/lib/resty/* /usr/local/share/lua/5.1/resty/ && \
    rm -rf /tmp/lua-resty-jwt

# 3. Install lua-resty-session (version 3.10 compatible avec Lua 5.1)
RUN git clone --branch v3.10 https://github.com/bungle/lua-resty-session.git /tmp/lua-resty-session && \
    cp -r /tmp/lua-resty-session/lib/resty/* /usr/local/share/lua/5.1/resty/ && \
    rm -rf /tmp/lua-resty-session

# 4. Install lua-resty-openidc
RUN git clone https://github.com/zmartzone/lua-resty-openidc.git /tmp/lua-resty-openidc && \
    cp -r /tmp/lua-resty-openidc/lib/resty/* /usr/local/share/lua/5.1/resty/ && \
    rm -rf /tmp/lua-resty-openidc

# 5. Install kong-oidc manually
RUN git clone https://github.com/nokia/kong-oidc.git /tmp/kong-oidc && \
    mkdir -p /usr/local/share/lua/5.1/kong/plugins/oidc && \
    cp -r /tmp/kong-oidc/kong/plugins/oidc/* /usr/local/share/lua/5.1/kong/plugins/oidc/ && \
    rm -rf /tmp/kong-oidc

USER kong
