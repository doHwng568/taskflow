package com.example.taskflow.user.dto.response;

import com.example.taskflow.common.enums.Role;
import com.example.taskflow.entity.User;

public record UserResponse(
        Long id,
        String username,
        String fullName,
        String email,
        Role role
) {
    public static UserResponse fromEntity(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getRole()
        );
    }
}

