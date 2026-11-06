
package com.example.taskflow.modules.workspace.dto.response;

import com.example.taskflow.common.enums.WorkspaceRole;
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

    private WorkspaceRole currentUserRole;

    private Integer memberCount;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
