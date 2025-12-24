package com.medinsight.ordonnance.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

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
                    .roles(java.util.Collections.emptyList())
                    .build();
        }
        return ctx;
    }

    public static void clear() {
        current.remove();
    }

    public boolean hasRole(String role) {
        return roles != null && (roles.contains(role) || roles.contains("ROLE_ADMIN"));
    }
}
