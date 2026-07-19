package com.jaelson.backend.repository;

import com.jaelson.backend.entity.Appointment;
import com.jaelson.backend.enums.AppointmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @EntityGraph(attributePaths = "service")
    @Query("""
            SELECT a FROM Appointment a
            WHERE a.id = :id
            """)
    Optional<Appointment> findByIdWithService(@Param("id") Long id);

    @EntityGraph(attributePaths = "service")
    @Query("""
            SELECT a FROM Appointment a
            WHERE (:date IS NULL OR a.appointmentDate = :date)
            """)
    Page<Appointment> findAllFiltered(
            @Param("date") LocalDate date,
            Pageable pageable
    );

    @Query("""
            SELECT a.appointmentTime FROM Appointment a
            WHERE a.appointmentDate = :date
              AND a.status <> :cancelledStatus
            """)
    List<LocalTime> findOccupiedTimesByDate(
            @Param("date") LocalDate date,
            @Param("cancelledStatus") AppointmentStatus cancelledStatus
    );

    boolean existsByAppointmentDateAndAppointmentTimeAndStatusNot(
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            AppointmentStatus status
    );
}
