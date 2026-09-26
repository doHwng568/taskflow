package com.example.taskflow.user;

import com.example.taskflow.common.dto.ApiResponse;
import com.example.taskflow.common.enums.ErrorCode;
import com.example.taskflow.common.exception.BusinessException;
import com.example.taskflow.entity.User;
import org.apache.coyote.Response;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@RestController
public class UserController {

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
}
