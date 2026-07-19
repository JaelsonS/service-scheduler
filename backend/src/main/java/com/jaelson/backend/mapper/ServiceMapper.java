package com.jaelson.backend.mapper;

import com.jaelson.backend.dto.service.ServiceResponseDTO;
import com.jaelson.backend.entity.Service;

public final class ServiceMapper {

    private ServiceMapper() {
    }

    public static ServiceResponseDTO toResponse(Service service) {
        return new ServiceResponseDTO(
                service.getId(),
                service.getName(),
                service.getDurationMinutes(),
                service.isActive()
        );
    }
}
