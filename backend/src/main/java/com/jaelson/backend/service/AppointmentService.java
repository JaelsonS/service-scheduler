package com.jaelson.backend.service;

import com.jaelson.backend.dto.appointment.AppointmentCreateRequestDTO;
import com.jaelson.backend.dto.appointment.AppointmentListResponseDTO;
import com.jaelson.backend.dto.appointment.AppointmentResponseDTO;
import com.jaelson.backend.dto.appointment.AppointmentSummaryResponseDTO;
import com.jaelson.backend.dto.appointment.AvailabilityResponseDTO;
import com.jaelson.backend.entity.Appointment;
import com.jaelson.backend.entity.ClientUser;
import com.jaelson.backend.entity.Service;
import com.jaelson.backend.enums.AppointmentStatus;
import com.jaelson.backend.enums.UserRole;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@org.springframework.stereotype.Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final ServiceCatalogService serviceCatalogService;
    private final ClientAuthService clientAuthService;
    private final Clock clock;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            ServiceCatalogService serviceCatalogService,
            ClientAuthService clientAuthService,
            Clock clock
    ) {
        this.appointmentRepository = appointmentRepository;
        this.serviceCatalogService = serviceCatalogService;
        this.clientAuthService = clientAuthService;
        this.clock = clock;
    }

    /**
     * Fluxo público de agendamento. Ordem importa:
     * 1) serviço ativo, 2) horário válido, 3) slot livre.
     * Se o cliente estiver autenticado, amarro o appointment ao user —
     * mas o booking continua aberto sem login (requisito do desafio).
     */
    @Transactional
    public AppointmentResponseDTO create(AppointmentCreateRequestDTO request) {
        Service service = serviceCatalogService.findActiveServiceOrThrow(request.serviceId());
        validateSchedule(request.appointmentDate(), request.appointmentTime(), service.getDurationMinutes());
        ensureNoOverlap(
                request.appointmentDate(),
                request.appointmentTime(),
                service.getDurationMinutes()
        );

        ClientUser clientUser = resolveAuthenticatedClient().orElse(null);
        Appointment appointment = AppointmentMapper.toEntity(request, service, clientUser);
        Appointment savedAppointment = appointmentRepository.save(appointment);

        return AppointmentMapper.toResponse(savedAppointment);
    }

    @Transactional(readOnly = true)
    public AppointmentResponseDTO findById(Long id) {
        return AppointmentMapper.toPublicResponse(findAppointmentOrThrow(id));
    }

    /**
     * Disponibilidade do dia para um serviço: grade de 30 min, mas cada slot
     * só entra se a duração do serviço cabe sem sobrepor agendamentos ativos.
     */
    @Transactional(readOnly = true)
    public AvailabilityResponseDTO getAvailability(LocalDate date, Long serviceId) {
        if (date.isBefore(LocalDate.now(clock))) {
            throw new InvalidAppointmentTimeException("Não é possível consultar disponibilidade de uma data passada");
        }

        Service service = serviceCatalogService.findActiveServiceOrThrow(serviceId);
        List<Appointment> active = appointmentRepository.findActiveWithServiceByDate(
                date,
                AppointmentStatus.CANCELADO
        );

        List<AvailabilitySlotGenerator.OccupiedInterval> occupied = active.stream()
                .map(appointment -> {
                    LocalTime start = appointment.getAppointmentTime();
                    int duration = appointment.getService().getDurationMinutes();
                    return new AvailabilitySlotGenerator.OccupiedInterval(
                            start,
                            start.plusMinutes(duration)
                    );
                })
                .toList();

        LocalDateTime now = LocalDateTime.now(clock);
        List<LocalTime> availableSlots = AvailabilitySlotGenerator.generateAvailableSlots(
                date,
                occupied,
                service.getDurationMinutes(),
                now
        );

        return new AvailabilityResponseDTO(date, availableSlots);
    }

    @Transactional(readOnly = true)
    public AppointmentListResponseDTO list(LocalDate date, String q, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);
        String normalizedQuery = (q == null || q.isBlank()) ? null : q.trim();

        PageRequest pageRequest = PageRequest.of(
                safePage,
                safeSize,
                Sort.by(Sort.Direction.DESC, "appointmentDate")
                        .and(Sort.by(Sort.Direction.ASC, "appointmentTime"))
        );

        Page<Appointment> appointments = appointmentRepository.findAllFiltered(date, normalizedQuery, pageRequest);
        return AppointmentMapper.toListResponse(appointments);
    }

    @Transactional(readOnly = true)
    public AppointmentSummaryResponseDTO summary(LocalDate date) {
        Map<AppointmentStatus, Long> byStatus = new EnumMap<>(AppointmentStatus.class);
        for (AppointmentStatus status : AppointmentStatus.values()) {
            byStatus.put(status, 0L);
        }

        long total = 0L;
        for (Object[] row : appointmentRepository.countGroupedByStatus(date)) {
            AppointmentStatus status = (AppointmentStatus) row[0];
            Long count = (Long) row[1];
            byStatus.put(status, count);
            total += count;
        }

        return new AppointmentSummaryResponseDTO(total, byStatus);
    }

    @Transactional(readOnly = true)
    public AppointmentListResponseDTO listForClient(String clientEmail) {
        ClientUser client = clientAuthService.requireActiveByEmail(clientEmail);
        return AppointmentMapper.toListResponse(appointmentRepository.findAllByClientUserId(client.getId()));
    }

    @Transactional
    public AppointmentResponseDTO cancelForClient(Long id, String clientEmail) {
        ClientUser client = clientAuthService.requireActiveByEmail(clientEmail);
        Appointment appointment = appointmentRepository.findByIdAndClientUserId(id, client.getId())
                .orElseThrow(() -> new AppointmentNotFoundException(id));

        AppointmentStatusTransitionValidator.validate(appointment.getStatus(), AppointmentStatus.CANCELADO);
        appointment.setStatus(AppointmentStatus.CANCELADO);
        return AppointmentMapper.toResponse(appointment);
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

    private java.util.Optional<ClientUser> resolveAuthenticatedClient() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return java.util.Optional.empty();
        }

        boolean isClient = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> authority.equals("ROLE_" + UserRole.CLIENT.name()));

        if (!isClient) {
            return java.util.Optional.empty();
        }

        return java.util.Optional.of(clientAuthService.requireActiveByEmail(authentication.getName()));
    }

    private void validateSchedule(LocalDate date, LocalTime time, int durationMinutes) {
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDate today = now.toLocalDate();

        if (date.isBefore(today)) {
            throw new InvalidAppointmentTimeException("A data do agendamento não pode ser no passado");
        }

        if (!AvailabilitySlotGenerator.fitsInBusinessHours(time, durationMinutes)) {
            throw new InvalidAppointmentTimeException(
                    "Horário fora do expediente ou duração não cabe no dia"
            );
        }

        if (date.isEqual(today) && time.isBefore(now.toLocalTime())) {
            throw new InvalidAppointmentTimeException(
                    "Este horário já passou. Escolha outro"
            );
        }
    }

    /**
     * Checagem de sobreposição por intervalo [início, início+duração).
     * O índice único parcial ainda protege o mesmo horário de início em corrida.
     */
    private void ensureNoOverlap(LocalDate date, LocalTime time, int durationMinutes) {
        LocalTime candidateEnd = time.plusMinutes(durationMinutes);
        List<Appointment> active = appointmentRepository.findActiveWithServiceByDate(
                date,
                AppointmentStatus.CANCELADO
        );

        boolean overlaps = active.stream().anyMatch(appointment -> {
            LocalTime start = appointment.getAppointmentTime();
            LocalTime end = start.plusMinutes(appointment.getService().getDurationMinutes());
            return time.isBefore(end) && start.isBefore(candidateEnd);
        });

        if (overlaps) {
            throw new AppointmentConflictException(
                    "Já existe um agendamento ativo que conflita com este horário"
            );
        }
    }
}
