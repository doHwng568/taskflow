package com.example.taskflow.modules.area.dto.request;

import jakarta.validation.constraints.Size;

public record CopyAreaRequest(
        @Size(max = 100, message = "name must be at most 100 characters")
        String name
) {
}

