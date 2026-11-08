package com.example.taskflow.modules.area.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateAreaRequest {

    @NotBlank(message = "Area name is required")
    @Size(max = 255, message = "Area name must be at most 255 characters")
    private String name;

    private Long workspaceId;

    private Double position;
}
