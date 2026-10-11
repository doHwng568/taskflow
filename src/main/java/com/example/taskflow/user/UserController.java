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

    @GetMapping("/random")
    public ResponseEntity<ApiResponse<String>> randomApi() {

        return ResponseEntity.ok()
                .body(ApiResponse.success("Random API"));
    }
}
