package com.jaelson.backend.controller;

import com.jaelson.backend.dto.appointment.AppointmentResponseDTO;
import com.jaelson.backend.dto.appointment.AvailabilityResponseDTO;
import com.jaelson.backend.dto.service.ServiceResponseDTO;
import com.jaelson.backend.enums.AppointmentStatus;
import com.jaelson.backend.exception.GlobalExceptionHandler;
import com.jaelson.backend.service.AppointmentService;
import com.jaelson.backend.service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AppointmentController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class AppointmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AppointmentService appointmentService;

    @MockitoBean
    private JwtService jwtService;

    @Test
    void shouldCreateAppointment() throws Exception {
        AppointmentResponseDTO response = new AppointmentResponseDTO(
                1L,
                "Maria Silva",
                "+5511999998888",
                LocalDate.of(2026, 7, 20),
                LocalTime.of(10, 0),
                AppointmentStatus.AGENDADO,
                new ServiceResponseDTO(1L, "Corte de Cabelo", 30, true),
                LocalDateTime.of(2026, 7, 16, 12, 0),
                LocalDateTime.of(2026, 7, 16, 12, 0)
        );

        when(appointmentService.create(any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "customerName": "Maria Silva",
                                  "customerPhone": "+5511999998888",
                                  "appointmentDate": "2026-07-20",
                                  "appointmentTime": "10:00:00",
                                  "serviceId": 1
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("AGENDADO"));
    }

    @Test
    void shouldReturnAvailability() throws Exception {
        when(appointmentService.getAvailability(LocalDate.of(2026, 7, 20), 1L, null))
                .thenReturn(new AvailabilityResponseDTO(
                        LocalDate.of(2026, 7, 20),
                        List.of(LocalTime.of(9, 0), LocalTime.of(9, 30))
                ));

        mockMvc.perform(get("/api/v1/appointments/availability")
                        .param("date", "2026-07-20")
                        .param("serviceId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.availableSlots.length()").value(2));
    }

    @Test
    void shouldRejectInvalidCreatePayload() throws Exception {
        mockMvc.perform(post("/api/v1/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "customerName": "",
                                  "customerPhone": "123",
                                  "appointmentDate": "2020-01-01",
                                  "appointmentTime": "10:00:00",
                                  "serviceId": null
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }
}
