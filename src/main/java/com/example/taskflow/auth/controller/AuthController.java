package com.example.taskflow.auth.controller;

import com.example.taskflow.auth.dto.request.LoginRequest;
import com.example.taskflow.auth.dto.request.RegisterRequest;
import com.example.taskflow.auth.dto.response.RegisterResponse;
import com.example.taskflow.auth.service.AuthServiceImpl;
import com.example.taskflow.common.dto.ApiResponse;
import com.example.taskflow.security.JwtService;
import com.example.taskflow.user.UserRepository;
import jakarta.validation.Valid;
import org.apache.coyote.Response;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final AuthServiceImpl authServiceImpl;

    public AuthController(AuthenticationManager authenticationManager, JwtService jwtService, AuthServiceImpl authServiceImpl) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.authServiceImpl = authServiceImpl;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegisterResponse>> register(@Valid @RequestBody RegisterRequest request) {

        RegisterResponse registerResponse = authServiceImpl.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(registerResponse, "Register successfully"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<String>> login(@RequestBody LoginRequest request) {
        try {
            // Spring Security tự so khớp password với hash trong DB
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>("401", "Invalid username or password", null, Instant.now()));
        }

        String token = jwtService.generateToken(request.username());
        return ResponseEntity.ok(new ApiResponse<>("200", "Success", token, Instant.now()));
    }
}
