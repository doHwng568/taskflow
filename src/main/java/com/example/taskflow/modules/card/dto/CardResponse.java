package com.example.taskflow.modules.card.dto;

import com.example.taskflow.common.enums.TaskPriority;
import com.example.taskflow.common.enums.TaskType;
import com.example.taskflow.entity.Card;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardResponse {

    private Long id;
    private String title;
    private String content;
    private String coverImage;
    private String comments;
    private Double position;
    private TaskPriority priority;
    private TaskType type;
    private LocalDateTime dueDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long areaId;
    private String areaName;
    private Long createdById;
    private Long assigneeId;

    public static CardResponse fromEntity(Card card) {
        return CardResponse.builder()
                .id(card.getId())
                .title(card.getTitle())
                .content(card.getContent())
                .coverImage(card.getCoverImage())
                .comments(card.getComments())
                .position(card.getPosition())
                .priority(card.getPriority())
                .type(card.getType())
                .dueDate(card.getDueDate())
                .createdAt(card.getCreatedAt())
                .updatedAt(card.getUpdatedAt())
                .areaId(card.getArea() != null ? card.getArea().getId() : null)
                .areaName(card.getArea() != null ? card.getArea().getName() : null)
                .createdById(card.getCreatedBy() != null ? card.getCreatedBy().getId() : null)
                .assigneeId(card.getAssignee() != null ? card.getAssignee().getId() : null)
                .build();
    }
}
