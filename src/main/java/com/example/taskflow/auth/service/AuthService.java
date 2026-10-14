package com.example.taskflow.auth.service;

import com.example.taskflow.auth.dto.request.LoginRequest;
import com.example.taskflow.auth.dto.request.RegisterRequest;
import com.example.taskflow.auth.dto.response.LoginResponse;
import com.example.taskflow.auth.dto.response.RegisterResponse;
import com.example.taskflow.auth.repository.AuthRepository;
import com.example.taskflow.common.enums.ErrorCode;
import com.example.taskflow.common.exception.BusinessException;
import com.example.taskflow.entity.User;
import com.example.taskflow.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService implements AuthServiceImpl {

    private final AuthRepository authRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(AuthRepository authRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.authRepository = authRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
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

    @Override
    public LoginResponse login(LoginRequest request) {
        if(!authRepository.existsByUsername(request.username())){
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        User userRepo = authRepository.findByUsername(request.username());

        boolean isMatchPassword = passwordEncoder.matches(request.password(), userRepo.getPassword());

        if(isMatchPassword) {
            return new LoginResponse(request.username(), jwtService.generateToken(request.username()));
        }
        throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
    }
}
