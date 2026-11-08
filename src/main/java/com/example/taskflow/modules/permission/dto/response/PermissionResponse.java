package com.example.taskflow.modules.permission.dto.response;

import com.example.taskflow.entity.Permission;

public record PermissionResponse(
        Long id,
        String name,
        String description,
        String module
) {
    public static PermissionResponse fromEntity(Permission permission) {
        return new PermissionResponse(
                permission.getId(),
                permission.getName(),
                permission.getDescription(),
                permission.getModule()
        );
    }
}

