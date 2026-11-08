package com.example.taskflow.modules.area.dto.request;

import jakarta.validation.constraints.NotNull;

// Body của PATCH /areas/{areaId}/workspace
// Area (cùng toàn bộ thẻ) được chuyển xuống cuối board của workspace đích.
public record MoveAreaToWorkspaceRequest(
        @NotNull(message = "targetWorkspaceId is required")
        Long targetWorkspaceId) {
}
