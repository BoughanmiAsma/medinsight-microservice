package com.medinsight.lab.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Collections;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserContext {
    private String userId;
    private String username;
    private String email;
    private List<String> roles;

    private static final ThreadLocal<UserContext> current = new ThreadLocal<>();

    public static void setCurrent(UserContext context) {
        current.set(context);
    }

    public static UserContext getCurrent() {
        UserContext ctx = current.get();
        if (ctx == null) {
            return UserContext.builder()
                    .roles(Collections.emptyList())
                    .build();
        }
        return ctx;
    }

    public static void clear() {
        current.remove();
    }

    public boolean hasRole(String role) {
        if (roles == null)
            return false;

        boolean isAdmin = roles.stream().anyMatch(r -> r.equalsIgnoreCase("ADMIN") ||
                r.equalsIgnoreCase("ROLE_ADMIN"));
        if (isAdmin)
            return true;

        return roles.stream().anyMatch(r -> r.equalsIgnoreCase(role) ||
                r.equalsIgnoreCase("ROLE_" + role));
    }

    public boolean hasAnyRole(String... requiredRoles) {
        for (String role : requiredRoles) {
            if (hasRole(role)) {
                return true;
            }
        }
        return false;
    }
}
