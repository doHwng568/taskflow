package com.example.taskflow.auth.dto.request;

import jakarta.validation.constraints.NotBlank;

public record RegisterRequest(
        @NotBlank(message = "username can not be blank")
        String username,
        @NotBlank(message = "password can not be blank")
        String password
) {}
