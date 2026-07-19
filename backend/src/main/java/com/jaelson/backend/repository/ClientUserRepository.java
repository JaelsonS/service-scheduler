package com.jaelson.backend.repository;

import com.jaelson.backend.entity.ClientUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClientUserRepository extends JpaRepository<ClientUser, Long> {

    Optional<ClientUser> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);
}
