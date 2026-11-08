package com.example.taskflow.modules.card.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MoveCardRequest {

    @NotNull(message = "Target area ID is required")
    private Long targetAreaId;

    private Double position;

    private String comment;
}
