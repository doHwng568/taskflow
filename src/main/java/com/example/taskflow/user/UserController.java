package com.example.taskflow.user;

import com.example.taskflow.common.dto.ApiResponse;
import com.example.taskflow.common.enums.ErrorCode;
import com.example.taskflow.common.exception.BusinessException;
import com.example.taskflow.config.SecurityConfig;
import com.example.taskflow.entity.User;
import com.example.taskflow.security.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
public class UserController {

    private JwtService jwtService;

    public UserController(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @GetMapping("/login")
    public ResponseEntity<User> login() throws Exception {

        User user = new User();
        user.setId(1L);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/register")
    public ResponseEntity<ApiResponse<String>> register() {
        System.out.println("REGISTER CONTROLLER CALLED");
        return ResponseEntity.ok(new ApiResponse<>("123", "Success", "dataa", Instant.now()));
    }

    @GetMapping("/test-jwt")
    public ResponseEntity<ApiResponse<String>> testJwt() {

        System.out.println(jwtService.generateToken("testjwt"));
        return ResponseEntity.ok(new ApiResponse<>("123", "Success", "Test JWT", Instant.now()));
    }
}
