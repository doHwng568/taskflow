package com.example.taskflow.user;

import com.example.taskflow.common.dto.ApiResponse;
import com.example.taskflow.common.enums.ErrorCode;
import com.example.taskflow.common.exception.BusinessException;
import com.example.taskflow.config.SecurityConfig;
import com.example.taskflow.entity.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
public class UserController {

    private SecurityConfig securityConfig;

    public UserController(SecurityConfig securityConfig) {
        this.securityConfig = securityConfig;
    }

    @GetMapping("/login")
    public ResponseEntity<User> login() throws Exception {

        User user = new User();
        user.setId(1L);

        if(user.getId() == 1){
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        return ResponseEntity.ok(user);
    }

    @GetMapping("/register")
    public ResponseEntity<ApiResponse<String>> register() {

        return ResponseEntity.ok(new ApiResponse<>("123", "Success", "dataa", Instant.now()));
    }

    @GetMapping("/test-jwt")
    public ResponseEntity<ApiResponse<String>> testJwt() {

        User user1 = securityConfig.test_001();
        User user2 = securityConfig.test_001();

        System.out.println(user1 == user2);  //true

        // set username for user1
        user1.setUsername("new name");

        // log username of user2 -> result: new name
        System.out.println(user2.getUsername());

        return ResponseEntity.ok(new ApiResponse<>("123", "Success", "Test JWT", Instant.now()));
    }
}
