package com.example.taskflow.modules.card.dto;

import com.example.taskflow.entity.CardMovement;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardMovementResponse {

    private Long id;
    private Long cardId;

    private Long fromAreaId;
    private String fromAreaName;

    private Long toAreaId;
    private String toAreaName;

    private Long movedById;
    private String movedByName;

    private LocalDateTime movedAt;
    private String comment;

    public static CardMovementResponse fromEntity(CardMovement movement) {
        return CardMovementResponse.builder()
                .id(movement.getId())
                .cardId(movement.getCard() != null ? movement.getCard().getId() : null)
                .fromAreaId(movement.getFromArea() != null ? movement.getFromArea().getId() : null)
                .fromAreaName(movement.getFromArea() != null ? movement.getFromArea().getName() : null)
                .toAreaId(movement.getToArea() != null ? movement.getToArea().getId() : null)
                .toAreaName(movement.getToArea() != null ? movement.getToArea().getName() : null)
                .movedById(movement.getMovedBy() != null ? movement.getMovedBy().getId() : null)
                .movedByName(movement.getMovedBy() != null ? movement.getMovedBy().getFullName() : null)
                .movedAt(movement.getMovedAt())
                .comment(movement.getComment())
                .build();
    }
}

