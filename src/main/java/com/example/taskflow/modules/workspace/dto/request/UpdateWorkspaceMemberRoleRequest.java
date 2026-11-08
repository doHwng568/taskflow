
package com.example.taskflow.modules.workspace.dto.request;

import com.example.taskflow.common.enums.WorkspaceRole;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateWorkspaceMemberRoleRequest {

    @NotNull(message = "New role is required")
    private WorkspaceRole role;
}
