
package com.example.taskflow.modules.workspace.dto.response;

import com.example.taskflow.common.enums.WorkspaceRole;
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

    private WorkspaceRole role;

    private LocalDateTime joinedAt;
}
