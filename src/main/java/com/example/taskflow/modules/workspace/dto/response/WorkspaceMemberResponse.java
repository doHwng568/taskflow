package com.example.taskflow.modules.workspace.dto.response;

import com.example.taskflow.common.enums.Role;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class WorkspaceMemberResponse {

    private Long id;

    private Long userId;

    private String username;

    private String fullName;

    private String email;

    // Đây là role của User, không phải Workspace role
    private Role userRole;

    private LocalDateTime joinedAt;
}