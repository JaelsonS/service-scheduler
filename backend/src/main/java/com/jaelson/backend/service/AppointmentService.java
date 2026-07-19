package com.jaelson.backend.service;

import com.jaelson.backend.dto.appointment.AppointmentCreateRequestDTO;
import com.jaelson.backend.dto.appointment.AppointmentListResponseDTO;
import com.jaelson.backend.dto.appointment.AppointmentResponseDTO;
import com.jaelson.backend.dto.appointment.AvailabilityResponseDTO;
import com.jaelson.backend.entity.Appointment;
import com.jaelson.backend.entity.Service;
import com.jaelson.backend.enums.AppointmentStatus;
import com.jaelson.backend.exception.AppointmentConflictException;
import com.jaelson.backend.exception.AppointmentNotFoundException;
import com.jaelson.backend.exception.InvalidAppointmentTimeException;
import com.jaelson.backend.mapper.AppointmentMapper;
import com.jaelson.backend.repository.AppointmentRepository;
import com.jaelson.backend.utils.AvailabilitySlotGenerator;
import com.jaelson.backend.validation.AppointmentStatusTransitionValidator;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@org.springframework.stereotype.Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final ServiceCatalogService serviceCatalogService;
    private final Clock clock;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            ServiceCatalogService serviceCatalogService,
            Clock clock
    ) {
        this.appointmentRepository = appointmentRepository;
        this.serviceCatalogService = serviceCatalogService;
        this.clock = clock;
    }

    @Transactional
    public AppointmentResponseDTO create(AppointmentCreateRequestDTO request) {
        Service service = serviceCatalogService.findActiveServiceOrThrow(request.serviceId());
        validateSchedule(request.appointmentDate(), request.appointmentTime());
        ensureSlotIsFree(request.appointmentDate(), request.appointmentTime());

        Appointment appointment = AppointmentMapper.toEntity(request, service);
        Appointment savedAppointment = appointmentRepository.save(appointment);

        return AppointmentMapper.toResponse(savedAppointment);
    }

    @Transactional(readOnly = true)
    public AppointmentResponseDTO findById(Long id) {
        return AppointmentMapper.toResponse(findAppointmentOrThrow(id));
    }

    @Transactional(readOnly = true)
    public AvailabilityResponseDTO getAvailability(LocalDate date) {
        if (date.isBefore(LocalDate.now(clock))) {
            throw new InvalidAppointmentTimeException("Cannot consult availability for a past date");
        }

        List<LocalTime> occupiedTimes = appointmentRepository.findOccupiedTimesByDate(
                date,
                AppointmentStatus.CANCELADO
        );

        Set<LocalTime> occupiedSet = new HashSet<>(occupiedTimes);
        LocalDateTime now = LocalDateTime.now(clock);
        List<LocalTime> availableSlots = AvailabilitySlotGenerator.generateAvailableSlots(
                date,
                occupiedSet,
                now
        );

        return new AvailabilityResponseDTO(date, availableSlots);
    }

    @Transactional(readOnly = true)
    public AppointmentListResponseDTO list(LocalDate date, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);

        PageRequest pageRequest = PageRequest.of(
                safePage,
                safeSize,
                Sort.by(Sort.Direction.DESC, "appointmentDate")
                        .and(Sort.by(Sort.Direction.ASC, "appointmentTime"))
        );

        Page<Appointment> appointments = appointmentRepository.findAllFiltered(date, pageRequest);
        return AppointmentMapper.toListResponse(appointments);
    }

    @Transactional
    public AppointmentResponseDTO updateStatus(Long id, AppointmentStatus targetStatus) {
        Appointment appointment = findAppointmentOrThrow(id);
        AppointmentStatusTransitionValidator.validate(appointment.getStatus(), targetStatus);
        appointment.setStatus(targetStatus);
        return AppointmentMapper.toResponse(appointment);
    }

    @Transactional
    public AppointmentResponseDTO cancel(Long id) {
        return updateStatus(id, AppointmentStatus.CANCELADO);
    }

    @Transactional
    public void delete(Long id) {
        Appointment appointment = findAppointmentOrThrow(id);
        appointmentRepository.delete(appointment);
    }

    private Appointment findAppointmentOrThrow(Long id) {
        return appointmentRepository.findByIdWithService(id)
                .orElseThrow(() -> new AppointmentNotFoundException(id));
    }

    private void validateSchedule(LocalDate date, LocalTime time) {
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDate today = now.toLocalDate();

        if (date.isBefore(today)) {
            throw new InvalidAppointmentTimeException("Appointment date cannot be in the past");
        }

        if (!AvailabilitySlotGenerator.isWithinBusinessHours(time)) {
            throw new InvalidAppointmentTimeException(
                    "Appointment time must be within business hours on a valid slot"
            );
        }

        if (date.isEqual(today) && time.isBefore(now.toLocalTime())) {
            throw new InvalidAppointmentTimeException(
                    "Appointment time cannot be in the past for the current day"
            );
        }
    }

    private void ensureSlotIsFree(LocalDate date, LocalTime time) {
        boolean occupied = appointmentRepository.existsByAppointmentDateAndAppointmentTimeAndStatusNot(
                date,
                time,
                AppointmentStatus.CANCELADO
        );

        if (occupied) {
            throw new AppointmentConflictException(
                    "There is already an active appointment at the selected date and time"
            );
        }
    }
}
