
package com.example.taskflow.modules.workspace.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateWorkspaceRequest {

    @NotBlank(message = "Workspace name is required")
    @Size(max = 150, message = "Workspace name must not exceed 150 characters")
    private String name;

    private String description;
}
