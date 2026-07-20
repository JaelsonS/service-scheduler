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
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

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
        validateSchedule(request.appointmentDate(), request.appointmentTime());
        ensureSlotIsFree(request.appointmentDate(), request.appointmentTime());

        ClientUser clientUser = resolveAuthenticatedClient().orElse(null);
        Appointment appointment = AppointmentMapper.toEntity(request, service, clientUser);
        Appointment savedAppointment = appointmentRepository.save(appointment);

        return AppointmentMapper.toResponse(savedAppointment);
    }

    @Transactional(readOnly = true)
    public AppointmentResponseDTO findById(Long id) {
        return AppointmentMapper.toResponse(findAppointmentOrThrow(id));
    }

    /**
     * Disponibilidade do dia: gero a grade de slots de negócio e subtraio
     * os ocupados (qualquer status != CANCELADO). Passado fica de fora.
     * A unicidade no banco (índice parcial) é a rede de segurança se duas
     * requisições corridas passarem daqui ao mesmo tempo.
     */
    @Transactional(readOnly = true)
    public AvailabilityResponseDTO getAvailability(LocalDate date) {
        if (date.isBefore(LocalDate.now(clock))) {
            throw new InvalidAppointmentTimeException("Não é possível consultar disponibilidade de uma data passada");
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

    private void validateSchedule(LocalDate date, LocalTime time) {
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDate today = now.toLocalDate();

        if (date.isBefore(today)) {
            throw new InvalidAppointmentTimeException("A data do agendamento não pode ser no passado");
        }

        if (!AvailabilitySlotGenerator.isWithinBusinessHours(time)) {
            throw new InvalidAppointmentTimeException(
                    "Horário fora do expediente ou inválido"
            );
        }

        if (date.isEqual(today) && time.isBefore(now.toLocalTime())) {
            throw new InvalidAppointmentTimeException(
                    "Este horário já passou. Escolha outro"
            );
        }
    }

    /**
     * Checagem otimista de conflito. A garantia real vem do índice único
     * parcial no PostgreSQL (status <> CANCELADO) — se duas requests
     * passarem juntas, a segunda cai em DataIntegrityViolation → 409.
     */
    private void ensureSlotIsFree(LocalDate date, LocalTime time) {
        boolean occupied = appointmentRepository.existsByAppointmentDateAndAppointmentTimeAndStatusNot(
                date,
                time,
                AppointmentStatus.CANCELADO
        );

        if (occupied) {
            throw new AppointmentConflictException(
                    "Já existe um agendamento ativo neste horário"
            );
        }
    }
}
