package com.jaelson.backend.service;

import com.jaelson.backend.entity.AdminUser;
import com.jaelson.backend.repository.AdminUserRepository;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AdminUserDetailsService implements UserDetailsService {

    private final AdminUserRepository adminUserRepository;

    public AdminUserDetailsService(AdminUserRepository adminUserRepository) {
        this.adminUserRepository = adminUserRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) {
        AdminUser user = adminUserRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException("Admin user not found"));

        return new User(
                user.getEmail(),
                user.getPasswordHash(),
                user.isActive(),
                true,
                true,
                true,
                AuthorityUtils.createAuthorityList("ROLE_ADMIN")
        );
    }
}
