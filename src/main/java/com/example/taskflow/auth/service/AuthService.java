package com.example.taskflow.auth.service;

import com.example.taskflow.auth.dto.request.LoginRequest;
import com.example.taskflow.auth.dto.request.RegisterRequest;
import com.example.taskflow.auth.dto.response.LoginResponse;
import com.example.taskflow.auth.dto.response.RegisterResponse;
import com.example.taskflow.auth.repository.AuthRepository;
import com.example.taskflow.common.enums.ErrorCode;
import com.example.taskflow.common.enums.Role;
import com.example.taskflow.common.exception.BusinessException;
import com.example.taskflow.entity.User;
import com.example.taskflow.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService implements AuthServiceImpl {

    private final AuthRepository authRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(AuthRepository authRepository, PasswordEncoder passwordEncoder, JwtService jwtService,
                       AuthenticationManager authenticationManager) {
        this.authRepository = authRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @Override
    public RegisterResponse register(RegisterRequest request) {

        if (authRepository.existsByUsername(request.username())) {
            throw new BusinessException(ErrorCode.USERNAME_ALREADY_EXISTS);
        }

        User user = new User();
        user.setUsername(request.username());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(Role.MEMBER);

        User userSaved = authRepository.save(user);
        return new RegisterResponse(user.getId(), userSaved.getUsername());
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password())
            );

            String token = jwtService.generateToken(authentication.getName());
            return new LoginResponse(authentication.getName(), token);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

    }
}
