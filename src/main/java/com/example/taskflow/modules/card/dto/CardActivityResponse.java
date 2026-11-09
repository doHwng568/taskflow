package com.example.taskflow.modules.card.dto;

import com.example.taskflow.entity.CardActivity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardActivityResponse {

    private Long id;
    private Long cardId;
    private Long userId;
    private String userName;
    private String userEmail;
    private String actionType;
    private String description;
    private LocalDateTime createdAt;

    public static CardActivityResponse fromEntity(CardActivity activity) {
        String name = null;
        String email = null;
        Long uid = null;
        if (activity.getUser() != null) {
            uid = activity.getUser().getId();
            email = activity.getUser().getEmail();
            name = activity.getUser().getFullName();
            if (name == null || name.isBlank()) {
                name = activity.getUser().getUsername();
            }
        }

        return CardActivityResponse.builder()
                .id(activity.getId())
                .cardId(activity.getCard() != null ? activity.getCard().getId() : null)
                .userId(uid)
                .userName(name)
                .userEmail(email)
                .actionType(activity.getActionType())
                .description(activity.getDescription())
                .createdAt(activity.getCreatedAt())
                .build();
    }
}

