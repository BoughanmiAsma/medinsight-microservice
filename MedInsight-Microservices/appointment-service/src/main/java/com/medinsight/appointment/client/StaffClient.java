package com.medinsight.appointment.client;

import com.medinsight.appointment.dto.StaffDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "staff-service", url = "${app.staff-service.url:http://staff-service:9002}")
public interface StaffClient {

    @GetMapping("/staffs/keycloak/{keycloakId}")
    StaffDTO getStaffByKeycloakId(@PathVariable("keycloakId") String keycloakId);
}
