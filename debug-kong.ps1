$KONG_ADMIN_URL = "http://localhost:8201"
# Unfortunately Kong log level is usually set in kong.conf or env var KONG_LOG_LEVEL
# But we can try to see if there is an endpoint or we just rely on `docker exec`.
# The best way without restarting is usually limited. 
# However, the user said "invalid token". 
# Common cause with kong-oidc:
# 1. Introspection endpoint returns active: false
# 2. Keycloak internal URL is different from external URL.

# Let's verify introspection response manually from the script.
$INTROSPECTION_ENDPOINT = "http://host.docker.internal:8180/realms/microservices-realm/protocol/openid-connect/token/introspect"

# We can try to curl introspection from INSIDE the Kong container to verify connectivity.
Write-Host "Checking connectivity from Kong to Keycloak..."
docker exec kong1 curl -s -X POST "http://host.docker.internal:8180/realms/microservices-realm/protocol/openid-connect/token/introspect" 
# Expecting "start of response" or at least connectivity.

# Also, let's try to grab a token and introspect it using the same credentials we gave Kong.
# Client: staff-service
# Secret: MNQvWX7MvoktTXlveKxvsPU8w2IWRqHc
