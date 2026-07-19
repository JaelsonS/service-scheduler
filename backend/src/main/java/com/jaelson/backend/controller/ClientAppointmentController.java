package com.jaelson.backend.controller;

import com.jaelson.backend.dto.appointment.AppointmentListResponseDTO;
import com.jaelson.backend.dto.appointment.AppointmentResponseDTO;
import com.jaelson.backend.service.AppointmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/client/appointments")
public class ClientAppointmentController {

    private final AppointmentService appointmentService;

    public ClientAppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping
    public ResponseEntity<AppointmentListResponseDTO> listMine(Authentication authentication) {
        return ResponseEntity.ok(appointmentService.listForClient(authentication.getName()));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<AppointmentResponseDTO> cancelMine(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(appointmentService.cancelForClient(id, authentication.getName()));
    }
}
