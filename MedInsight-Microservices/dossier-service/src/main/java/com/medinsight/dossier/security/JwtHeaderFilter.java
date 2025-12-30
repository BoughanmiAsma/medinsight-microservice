package com.medinsight.dossier.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class JwtHeaderFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String userId = request.getHeader("X-User-Id");
        String username = request.getHeader("X-User-Username");
        String email = request.getHeader("X-User-Email");
        String rolesHeader = request.getHeader("X-User-Roles");

        UserContext context = null;

        if (userId != null) {
            List<String> roles = Collections.emptyList();
            if (rolesHeader != null && !rolesHeader.isEmpty()) {
                roles = Arrays.stream(rolesHeader.split(","))
                        .map(String::trim)
                        .collect(Collectors.toList());
            }

            context = UserContext.builder()
                    .userId(userId)
                    .username(username)
                    .email(email)
                    .roles(roles)
                    .build();
        } else {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                try {
                    String token = authHeader.substring(7);
                    String[] parts = token.split("\\.");
                    if (parts.length >= 2) {
                        String payloadJson = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
                        Map<String, Object> payload = objectMapper.readValue(payloadJson, Map.class);

                        List<String> roles = new ArrayList<>();
                        if (payload.get("realm_access") instanceof Map) {
                            Map<?, ?> realmAccess = (Map<?, ?>) payload.get("realm_access");
                            if (realmAccess.get("roles") instanceof List) {
                                roles.addAll((List<String>) realmAccess.get("roles"));
                            }
                        }
                        if (payload.get("resource_access") instanceof Map) {
                            Map<?, ?> resourceAccess = (Map<?, ?>) payload.get("resource_access");
                            for (Object clientAccessObj : resourceAccess.values()) {
                                if (clientAccessObj instanceof Map) {
                                    Map<?, ?> clientAccess = (Map<?, ?>) clientAccessObj;
                                    if (clientAccess.get("roles") instanceof List) {
                                        roles.addAll((List<String>) clientAccess.get("roles"));
                                    }
                                }
                            }
                        }

                        context = UserContext.builder()
                                .userId((String) payload.get("sub"))
                                .username((String) payload.get("preferred_username"))
                                .email((String) payload.get("email"))
                                .roles(roles.stream().distinct().collect(Collectors.toList()))
                                .build();
                    }
                } catch (Exception e) {
                    this.logger.debug("OIDC: Failed to decode fallback JWT: " + e.getMessage());
                }
            }
        }

        if (context != null) {
            UserContext.setCurrent(context);
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            UserContext.clear();
        }
    }
}
