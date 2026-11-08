package com.example.taskflow.modules.area.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateAreaRequest {

    @Size(max = 255, message = "Area name must be at most 255 characters")
    private String name;

    private Double position;
}
