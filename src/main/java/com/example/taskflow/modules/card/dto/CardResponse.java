package com.example.taskflow.modules.card.dto;

import com.example.taskflow.common.enums.Role;
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
    private boolean archived;
    private Double position;
    private TaskPriority priority;
    private TaskType type;
    private LocalDateTime dueDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long areaId;
    private String areaName;
    private Long createdById;
    private String createdByName;
    private Long updatedById;
    private String updatedByName;
    private Long assigneeId;
    private String assigneeName;
    private String assigneeUsername;
    private Role assigneeRole;

    public static CardResponse fromEntity(Card card) {
        String createdByName = null;
        if (card.getCreatedBy() != null) {
            createdByName = card.getCreatedBy().getFullName();
            if (createdByName == null || createdByName.isBlank()) {
                createdByName = card.getCreatedBy().getUsername();
            }
        }

        String updatedByName = null;
        if (card.getUpdatedBy() != null) {
            updatedByName = card.getUpdatedBy().getFullName();
            if (updatedByName == null || updatedByName.isBlank()) {
                updatedByName = card.getUpdatedBy().getUsername();
            }
        }

        String assigneeName = null;
        String assigneeUsername = null;
        Role assigneeRole = null;
        if (card.getAssignee() != null) {
            assigneeName = card.getAssignee().getFullName();
            if (assigneeName == null || assigneeName.isBlank()) {
                assigneeName = card.getAssignee().getUsername();
            }
            assigneeUsername = card.getAssignee().getUsername();
            assigneeRole = card.getAssignee().getRole();
        }

        return CardResponse.builder()
                .id(card.getId())
                .title(card.getTitle())
                .content(card.getContent())
                .coverImage(card.getCoverImage())
                .comments(card.getComments())
                .archived(card.isArchived())
                .position(card.getPosition())
                .priority(card.getPriority())
                .type(card.getType())
                .dueDate(card.getDueDate())
                .createdAt(card.getCreatedAt())
                .updatedAt(card.getUpdatedAt())
                .areaId(card.getArea() != null ? card.getArea().getId() : null)
                .areaName(card.getArea() != null ? card.getArea().getName() : null)
                .createdById(card.getCreatedBy() != null ? card.getCreatedBy().getId() : null)
                .createdByName(createdByName)
                .updatedById(card.getUpdatedBy() != null ? card.getUpdatedBy().getId() : null)
                .updatedByName(updatedByName)
                .assigneeId(card.getAssignee() != null ? card.getAssignee().getId() : null)
                .assigneeName(assigneeName)
                .assigneeUsername(assigneeUsername)
                .assigneeRole(assigneeRole)
                .build();
    }
}
