package com.example.taskflow.modules.user.dto.request;

import com.example.taskflow.common.enums.Role;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(
        @NotNull(message = "Role không được để trống")
        Role role
) {
}

