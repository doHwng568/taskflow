package com.example.taskflow.modules.area.dto;

import com.example.taskflow.entity.Area;
import com.example.taskflow.modules.card.dto.CardResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AreaResponse {

    private Long id;
    private String name;
    private Double position;
    private Long workspaceId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<CardResponse> cards;

    public static AreaResponse fromEntity(Area area, List<CardResponse> cards) {
        return AreaResponse.builder()
                .id(area.getId())
                .name(area.getName())
                .position(area.getPosition())
                .workspaceId(area.getWorkspace() != null ? area.getWorkspace().getId() : null)
                .createdAt(area.getCreatedAt())
                .updatedAt(area.getUpdatedAt())
                .cards(cards)
                .build();
    }
}
