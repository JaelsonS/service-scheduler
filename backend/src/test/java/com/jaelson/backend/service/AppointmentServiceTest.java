package com.jaelson.backend.service;

import com.jaelson.backend.dto.appointment.AppointmentCreateRequestDTO;
import com.jaelson.backend.entity.Appointment;
import com.jaelson.backend.entity.Service;
import com.jaelson.backend.enums.AppointmentStatus;
import com.jaelson.backend.exception.AppointmentConflictException;
import com.jaelson.backend.exception.InvalidAppointmentTimeException;
import com.jaelson.backend.repository.AppointmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    private static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private ServiceCatalogService serviceCatalogService;

    @Mock
    private ClientAuthService clientAuthService;

    private AppointmentService appointmentService;

    private Clock clock;
    private Service activeService;

    @BeforeEach
    void setUp() {
        clock = Clock.fixed(Instant.parse("2026-07-16T13:00:00Z"), ZONE);
        appointmentService = new AppointmentService(
                appointmentRepository,
                serviceCatalogService,
                clientAuthService,
                clock
        );

        activeService = new Service();
        activeService.setId(1L);
        activeService.setName("Corte de Cabelo");
        activeService.setDurationMinutes(30);
        activeService.setActive(true);
    }

    @Test
    void shouldCreateAppointmentWhenSlotIsAvailable() {
        AppointmentCreateRequestDTO request = new AppointmentCreateRequestDTO(
                "Maria Silva",
                "11999998888",
                LocalDate.of(2026, 7, 17),
                LocalTime.of(10, 0),
                1L
        );

        when(serviceCatalogService.findActiveServiceOrThrow(1L)).thenReturn(activeService);
        when(appointmentRepository.findActiveWithServiceByDate(
                request.appointmentDate(),
                AppointmentStatus.CANCELADO
        )).thenReturn(List.of());
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> {
            Appointment appointment = invocation.getArgument(0);
            appointment.setId(10L);
            return appointment;
        });

        var response = appointmentService.create(request);

        assertEquals(10L, response.id());
        assertEquals(AppointmentStatus.AGENDADO, response.status());
        assertEquals("Maria Silva", response.customerName());

        ArgumentCaptor<Appointment> captor = ArgumentCaptor.forClass(Appointment.class);
        verify(appointmentRepository).save(captor.capture());
        assertEquals(activeService, captor.getValue().getService());
    }

    @Test
    void shouldRejectPastTimeOnCurrentDay() {
        AppointmentCreateRequestDTO request = new AppointmentCreateRequestDTO(
                "Maria Silva",
                "11999998888",
                LocalDate.of(2026, 7, 16),
                LocalTime.of(9, 0),
                1L
        );

        when(serviceCatalogService.findActiveServiceOrThrow(1L)).thenReturn(activeService);

        assertThrows(InvalidAppointmentTimeException.class, () -> appointmentService.create(request));
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void shouldAllowSlotThatMatchesNowOnCurrentDay() {
        AppointmentCreateRequestDTO request = new AppointmentCreateRequestDTO(
                "Maria Silva",
                "11999998888",
                LocalDate.of(2026, 7, 16),
                LocalTime.of(10, 0),
                1L
        );

        when(serviceCatalogService.findActiveServiceOrThrow(1L)).thenReturn(activeService);
        when(appointmentRepository.findActiveWithServiceByDate(
                request.appointmentDate(),
                AppointmentStatus.CANCELADO
        )).thenReturn(List.of());
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> {
            Appointment appointment = invocation.getArgument(0);
            appointment.setId(10L);
            return appointment;
        });

        var response = appointmentService.create(request);

        assertEquals(10L, response.id());
        assertEquals(AppointmentStatus.AGENDADO, response.status());
    }

    @Test
    void shouldRejectOverlappingSlot() {
        AppointmentCreateRequestDTO request = new AppointmentCreateRequestDTO(
                "Maria Silva",
                "11999998888",
                LocalDate.of(2026, 7, 17),
                LocalTime.of(10, 0),
                1L
        );

        Appointment existing = new Appointment();
        existing.setAppointmentTime(LocalTime.of(10, 0));
        existing.setService(activeService);

        when(serviceCatalogService.findActiveServiceOrThrow(1L)).thenReturn(activeService);
        when(appointmentRepository.findActiveWithServiceByDate(
                eq(request.appointmentDate()),
                eq(AppointmentStatus.CANCELADO)
        )).thenReturn(List.of(existing));

        assertThrows(AppointmentConflictException.class, () -> appointmentService.create(request));
        verify(appointmentRepository, never()).save(any());
    }
}
