package com.example.taskflow.modules.card.dto;

import com.example.taskflow.common.enums.TaskPriority;
import com.example.taskflow.common.enums.TaskType;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CreateCardRequest {

    @NotBlank(message = "Card title is required")
    private String title;

    private String content;

    private String coverImage;

    private Long areaId;

    private Double position;

    private TaskPriority priority;

    private TaskType type;

    private LocalDateTime dueDate;

    private Long assigneeId;
}
