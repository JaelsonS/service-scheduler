package com.jaelson.backend.controller;

import com.jaelson.backend.dto.service.ServiceResponseDTO;
import com.jaelson.backend.service.ServiceCatalogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/services")
public class ServiceController {

    private final ServiceCatalogService serviceCatalogService;

    public ServiceController(ServiceCatalogService serviceCatalogService) {
        this.serviceCatalogService = serviceCatalogService;
    }

    @GetMapping
    public ResponseEntity<List<ServiceResponseDTO>> listActiveServices() {
        return ResponseEntity.ok(serviceCatalogService.listActiveServices());
    }
}
