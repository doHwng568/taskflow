
package com.example.taskflow.modules.workspace.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TransferWorkspaceOwnershipRequest {

    @NotNull(message = "New owner ID is required")
    private Long newOwnerId;
}
