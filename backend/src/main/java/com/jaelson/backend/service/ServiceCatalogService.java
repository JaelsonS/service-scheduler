package com.jaelson.backend.service;

import com.jaelson.backend.dto.service.ServiceResponseDTO;
import com.jaelson.backend.entity.Service;
import com.jaelson.backend.exception.InactiveServiceException;
import com.jaelson.backend.exception.ServiceNotFoundException;
import com.jaelson.backend.mapper.ServiceMapper;
import com.jaelson.backend.repository.ServiceRepository;

import java.util.List;

@org.springframework.stereotype.Service
public class ServiceCatalogService {

    private final ServiceRepository serviceRepository;

    public ServiceCatalogService(ServiceRepository serviceRepository) {
        this.serviceRepository = serviceRepository;
    }

    public List<ServiceResponseDTO> listActiveServices() {
        return serviceRepository.findAllByActiveTrueOrderByNameAsc()
                .stream()
                .map(ServiceMapper::toResponse)
                .toList();
    }

    public Service findActiveServiceOrThrow(Long serviceId) {
        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ServiceNotFoundException(serviceId));

        if (!service.isActive()) {
            throw new InactiveServiceException(serviceId);
        }

        return service;
    }
}
