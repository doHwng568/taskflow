package com.example.taskflow.modules.area.dto.request;

import jakarta.validation.constraints.NotNull;

// Body của PATCH /areas/{areaId}/pin
// pinned = true: ghim lên đầu board, false: bỏ ghim.
public record PinAreaRequest(
        @NotNull(message = "pinned is required")
        Boolean pinned) {
}
