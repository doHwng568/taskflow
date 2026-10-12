package com.example.taskflow.auth.controller;

import com.example.taskflow.auth.dto.request.LoginRequest;
import com.example.taskflow.auth.dto.request.RegisterRequest;
import com.example.taskflow.auth.dto.response.LoginResponse;
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

    private final AuthServiceImpl authServiceImpl;

    public AuthController(AuthServiceImpl authServiceImpl) {
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
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse loginResponse = authServiceImpl.login(request);

        return ResponseEntity
                .status(HttpStatus.OK)
                .body((ApiResponse.success(loginResponse, "Login successfully")));
    }
}
