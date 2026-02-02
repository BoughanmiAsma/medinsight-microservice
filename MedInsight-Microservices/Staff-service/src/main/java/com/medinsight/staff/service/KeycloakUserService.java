package com.medinsight.staff.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class KeycloakUserService {

    private final RestTemplate restTemplate;

    @Value("${keycloak.server-url}")
    private String serverUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.client-id}")
    private String clientId;

    @Value("${keycloak.client-secret}")
    private String clientSecret;

    private String getAdminToken() {
        String url = serverUrl + "/realms/master/protocol/openid-connect/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("grant_type", "password");
        map.add("client_id", "admin-cli");
        map.add("username", "admin");
        map.add("password", "admin");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restTemplate.postForObject(url, request, Map.class);

        return (String) response.get("access_token");
    }

    public String createUser(String username, String email, String firstName, String lastName, String password) {
        log.info("Tentative de création d'utilisateur via REST: {}", email);
        String token = getAdminToken();
        String url = serverUrl + "/admin/realms/" + realm + "/users";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> user = new HashMap<>();
        user.put("username", username);
        user.put("email", email);
        user.put("firstName", firstName);
        user.put("lastName", lastName);
        user.put("enabled", true);

        Map<String, Object> credential = new HashMap<>();
        credential.put("type", "password");
        credential.put("value", password);
        credential.put("temporary", false);
        user.put("credentials", Collections.singletonList(credential));

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(user, headers);

        ResponseEntity<Void> response = restTemplate.postForEntity(url, request, Void.class);

        if (response.getStatusCode() == HttpStatus.CREATED) {
            String location = response.getHeaders().getLocation().getPath();
            String userId = location.replaceAll(".*/([^/]+)$", "$1");
            log.info("Utilisateur créé dans Keycloak via REST avec ID: {}", userId);
            return userId;
        } else {
            log.error("Échec de la création d'utilisateur. Status: {}", response.getStatusCode());
            throw new RuntimeException("Keycloak user creation failed via REST");
        }
    }

    public void updateUser(String keycloakId, String firstName, String lastName) {
        log.info("Mise à jour de l'utilisateur Keycloak: {}", keycloakId);
        String token = getAdminToken();
        String url = serverUrl + "/admin/realms/" + realm + "/users/" + keycloakId;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> user = new HashMap<>();
        user.put("firstName", firstName);
        user.put("lastName", lastName);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(user, headers);

        restTemplate.put(url, request);
        log.info("Utilisateur Keycloak {} mis à jour avec succès", keycloakId);
    }

    public void assignRealmRoleToUser(String userId, String roleName) {
        log.info("Assignation du rôle {} à l'utilisateur {} via REST", roleName, userId);
        String token = getAdminToken();

        // 1. Get Role Representation
        String getRoleUrl = serverUrl + "/admin/realms/" + realm + "/roles/" + roleName;
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        HttpEntity<Void> getRequest = new HttpEntity<>(headers);
        @SuppressWarnings("unchecked")
        Map<String, Object> role = restTemplate.exchange(getRoleUrl, HttpMethod.GET, getRequest, Map.class).getBody();

        // 2. Assign Role
        String assignUrl = serverUrl + "/admin/realms/" + realm + "/users/" + userId + "/role-mappings/realm";
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<List<Map<String, Object>>> assignRequest = new HttpEntity<>(Collections.singletonList(role),
                headers);
        restTemplate.postForEntity(assignUrl, assignRequest, Void.class);

        log.info("Rôle {} assigné avec succès via REST", roleName);
    }
}
