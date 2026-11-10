package com.example.taskflow.modules.workspace.dto.response;

import com.example.taskflow.common.enums.Role;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class WorkspaceResponse {

    private Long id;

    private String name;

    private String description;

    private String ownerUsername;

    // Role lấy trực tiếp từ User
    private Role currentUserRole;

    private Integer memberCount;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}