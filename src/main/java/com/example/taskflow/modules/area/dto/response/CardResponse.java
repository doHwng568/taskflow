package com.example.taskflow.modules.area.dto.response;

import com.example.taskflow.common.enums.TaskPriority;
import com.example.taskflow.common.enums.TaskType;
import com.example.taskflow.entity.Card;

import java.time.LocalDateTime;

public record CardResponse(
        Long id,
        String title,
        String content,
        Double position,
        TaskPriority priority,
        TaskType type,
        LocalDateTime dueDate) {

    public static CardResponse from(Card card) {
        return new CardResponse(
                card.getId(),
                card.getTitle(),
                card.getContent(),
                card.getPosition(),
                card.getPriority(),
                card.getType(),
                card.getDueDate());
    }
}