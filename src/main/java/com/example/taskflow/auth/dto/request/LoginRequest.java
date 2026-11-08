package com.example.taskflow.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import org.hibernate.validator.constraints.Length;

public record LoginRequest(
        @NotBlank(message = "username can not be blank")
        @Length(min = 6, max = 20, message = "username must has length between 6 and 20")
        String username,
        @NotBlank(message = "password can not be blank")
        @Length(min = 6, max = 20, message = "username must has length between 6 and 20")
        String password
) {}
