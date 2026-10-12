package com.example.taskflow.auth.service;

import com.example.taskflow.auth.dto.request.RegisterRequest;
import com.example.taskflow.auth.dto.response.RegisterResponse;
import com.example.taskflow.auth.repository.AuthRepository;
import com.example.taskflow.common.enums.ErrorCode;
import com.example.taskflow.common.exception.BusinessException;
import com.example.taskflow.entity.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService implements AuthServiceImpl {

    private final AuthRepository authRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AuthRepository authRepository, PasswordEncoder passwordEncoder) {
        this.authRepository = authRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public RegisterResponse register(RegisterRequest request) {

        if (authRepository.existsByUsername(request.username())) {
            throw new BusinessException(ErrorCode.USERNAME_ALREADY_EXISTS);
        }

        User user = User
                .builder()
                .username(request.username())
                .password(passwordEncoder.encode(request.password()))
                .build();

        User userSaved = authRepository.save(user);
        return new RegisterResponse(user.getId(), userSaved.getUsername());
    }
}
