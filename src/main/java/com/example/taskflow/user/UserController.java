package com.example.taskflow.user;

import com.example.taskflow.common.dto.ApiResponse;
import com.example.taskflow.common.enums.ErrorCode;
import com.example.taskflow.common.exception.BusinessException;
import com.example.taskflow.config.SecurityConfig;
import com.example.taskflow.entity.User;
import com.example.taskflow.security.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping
    public List<User> getAll() {
        return List.of(new User(1L, "Hehe"), new User(2L, "Bob"));
    }
}
