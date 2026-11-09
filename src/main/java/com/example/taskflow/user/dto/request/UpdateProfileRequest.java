package com.example.taskflow.user.dto.request;

import jakarta.validation.constraints.NotBlank;

public record UpdateProfileRequest(
        @NotBlank(message = "Họ và tên không được để trống")
        String fullName
) {
}

