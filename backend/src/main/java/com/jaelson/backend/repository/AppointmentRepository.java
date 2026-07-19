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
              AND (
                    :q IS NULL
                    OR LOWER(a.customerName) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%'))
                    OR a.customerPhone LIKE CONCAT('%', CAST(:q AS string), '%')
                  )
            """)
    Page<Appointment> findAllFiltered(
            @Param("date") LocalDate date,
            @Param("q") String q,
            Pageable pageable
    );

    @EntityGraph(attributePaths = "service")
    @Query("""
            SELECT a FROM Appointment a
            WHERE a.clientUser.id = :clientUserId
            ORDER BY a.appointmentDate DESC, a.appointmentTime DESC
            """)
    List<Appointment> findAllByClientUserId(@Param("clientUserId") Long clientUserId);

    @EntityGraph(attributePaths = {"service", "clientUser"})
    @Query("""
            SELECT a FROM Appointment a
            WHERE a.id = :id AND a.clientUser.id = :clientUserId
            """)
    Optional<Appointment> findByIdAndClientUserId(
            @Param("id") Long id,
            @Param("clientUserId") Long clientUserId
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

    @Query("""
            SELECT a.status, COUNT(a) FROM Appointment a
            WHERE (:date IS NULL OR a.appointmentDate = :date)
            GROUP BY a.status
            """)
    List<Object[]> countGroupedByStatus(@Param("date") LocalDate date);

    boolean existsByAppointmentDateAndAppointmentTimeAndStatusNot(
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            AppointmentStatus status
    );
}
