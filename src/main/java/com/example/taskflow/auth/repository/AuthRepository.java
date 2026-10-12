package com.example.taskflow.auth.repository;

import com.example.taskflow.auth.dto.request.LoginRequest;
import com.example.taskflow.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthRepository extends JpaRepository<User, Long> {
    boolean existsByUsername(String username);

    User findByUsername(String username);
}
