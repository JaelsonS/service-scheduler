package com.jaelson.backend.repository;

import com.jaelson.backend.entity.Service;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceRepository extends JpaRepository<Service, Long> {

    List<Service> findAllByActiveTrueOrderByNameAsc();
}
