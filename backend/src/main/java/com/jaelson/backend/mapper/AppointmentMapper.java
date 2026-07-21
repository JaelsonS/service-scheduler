package com.jaelson.backend.mapper;

import com.jaelson.backend.dto.appointment.AppointmentCreateRequestDTO;
import com.jaelson.backend.dto.appointment.AppointmentListResponseDTO;
import com.jaelson.backend.dto.appointment.AppointmentResponseDTO;
import com.jaelson.backend.entity.Appointment;
import com.jaelson.backend.entity.ClientUser;
import com.jaelson.backend.entity.Service;
import com.jaelson.backend.enums.AppointmentStatus;
import com.jaelson.backend.utils.PhoneMasker;
import org.springframework.data.domain.Page; // Para lidar com paginação de resultados

import java.util.List;

public final class AppointmentMapper {

    private AppointmentMapper() {
    }

    public static Appointment toEntity(
            AppointmentCreateRequestDTO request,
            Service service,
            ClientUser clientUser
    ) {
        Appointment appointment = new Appointment();
        appointment.setCustomerName(request.customerName().trim());
        appointment.setCustomerPhone(request.customerPhone().trim());
        appointment.setAppointmentDate(request.appointmentDate());
        appointment.setAppointmentTime(request.appointmentTime());
        appointment.setStatus(AppointmentStatus.AGENDADO);
        appointment.setService(service);
        appointment.setClientUser(clientUser);
        return appointment;
    }

    public static AppointmentResponseDTO toResponse(Appointment appointment) {
        return new AppointmentResponseDTO(
                appointment.getId(),
                appointment.getCustomerName(),
                appointment.getCustomerPhone(),
                appointment.getAppointmentDate(),
                appointment.getAppointmentTime(),
                appointment.getStatus(),
                ServiceMapper.toResponse(appointment.getService()),
                appointment.getCreatedAt(),
                appointment.getUpdatedAt()
        );
    }

    /** Confirmação pública: telefone mascarado (não vaza PII completa por ID). */
    public static AppointmentResponseDTO toPublicResponse(Appointment appointment) {
        return new AppointmentResponseDTO(
                appointment.getId(),
                appointment.getCustomerName(),
                PhoneMasker.mask(appointment.getCustomerPhone()),
                appointment.getAppointmentDate(),
                appointment.getAppointmentTime(),
                appointment.getStatus(),
                ServiceMapper.toResponse(appointment.getService()),
                appointment.getCreatedAt(),
                appointment.getUpdatedAt()
        );
    }

    public static AppointmentListResponseDTO toListResponse(Page<Appointment> page) {
        List<AppointmentResponseDTO> appointments = page.getContent()
                .stream()
                .map(AppointmentMapper::toResponse)
                .toList();

        return new AppointmentListResponseDTO(
                appointments,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }

    public static AppointmentListResponseDTO toListResponse(List<Appointment> appointments) {
        List<AppointmentResponseDTO> items = appointments.stream()
                .map(AppointmentMapper::toResponse)
                .toList();

        return new AppointmentListResponseDTO(
                items,
                0,
                items.size(),
                items.size(),
                1
        );
    }
}
