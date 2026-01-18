package com.medinsight.ordonnance.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
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

        UserContext context = null;

        // 1. Check if Spring Security already authenticated the request
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof JwtAuthenticationToken) {
            Jwt jwt = ((JwtAuthenticationToken) auth).getToken();
            context = fromJwt(jwt);
        }

        // 2. Fallback to Headers (Kong or previous version)
        if (context == null) {
            context = fromHeaders(request);
        }

        // 3. Fallback to manual JWT decoding (Legacy/Internal)
        if (context == null) {
            context = fromAuthHeader(request);
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

    private UserContext fromJwt(Jwt jwt) {
        List<String> roles = new ArrayList<>();
        Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess != null && realmAccess.get("roles") instanceof List) {
            @SuppressWarnings("unchecked")
            List<String> realmRoles = (List<String>) realmAccess.get("roles");
            roles.addAll(realmRoles);
        }

        return UserContext.builder()
                .userId(jwt.getSubject())
                .username(jwt.getClaimAsString("preferred_username"))
                .email(jwt.getClaimAsString("email"))
                .roles(roles.stream().map(String::toUpperCase).distinct().collect(Collectors.toList()))
                .build();
    }

    private UserContext fromHeaders(HttpServletRequest request) {
        String userId = request.getHeader("X-User-Id");
        if (userId == null)
            return null;

        String username = request.getHeader("X-User-Username");
        String email = request.getHeader("X-User-Email");
        String rolesHeader = request.getHeader("X-User-Roles");

        List<String> roles = Collections.emptyList();
        if (rolesHeader != null && !rolesHeader.isEmpty()) {
            roles = Arrays.stream(rolesHeader.split(","))
                    .map(String::trim)
                    .map(String::toUpperCase)
                    .collect(Collectors.toList());
        }

        return UserContext.builder()
                .userId(userId)
                .username(username)
                .email(email)
                .roles(roles)
                .build();
    }

    private UserContext fromAuthHeader(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            return null;

        try {
            String token = authHeader.substring(7);
            String[] parts = token.split("\\.");
            if (parts.length >= 2) {
                String payloadJson = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
                @SuppressWarnings("unchecked")
                Map<String, Object> payload = objectMapper.readValue(payloadJson, Map.class);
                List<String> roles = new ArrayList<>();
                if (payload.get("realm_access") instanceof Map) {
                    Map<?, ?> realmAccess = (Map<?, ?>) payload.get("realm_access");
                    if (realmAccess.get("roles") instanceof List) {
                        @SuppressWarnings("unchecked")
                        List<String> realmRoles = (List<String>) realmAccess.get("roles");
                        roles.addAll(realmRoles);
                    }
                }
                return UserContext.builder()
                        .userId((String) payload.get("sub"))
                        .username((String) payload.get("preferred_username"))
                        .email((String) payload.get("email"))
                        .roles(roles.stream().map(String::toUpperCase).distinct().collect(Collectors.toList()))
                        .build();
            }
        } catch (Exception e) {
            this.logger.debug("OIDC: Failed to decode fallback JWT: " + e.getMessage());
        }
        return null;
    }
}
