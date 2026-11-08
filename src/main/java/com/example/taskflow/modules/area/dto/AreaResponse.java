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
    // Màu nền dạng hex (vd "#1E40AF"), null = màu mặc định
    private String color;
    // true = đã lưu trữ, không hiện trên board
    private boolean archived;
    // true = đã ghim, hiện ở đầu board
    private boolean pinned;
    private int cardCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<CardResponse> cards;

    public static AreaResponse fromEntity(Area area, List<CardResponse> cards) {
        return AreaResponse.builder()
                .id(area.getId())
                .name(area.getName())
                .position(area.getPosition())
                .workspaceId(area.getWorkspace() != null ? area.getWorkspace().getId() : null)
                .color(area.getColor())
                .archived(area.isArchived())
                .pinned(area.isPinned())
                .cardCount(cards.size())
                .createdAt(area.getCreatedAt())
                .updatedAt(area.getUpdatedAt())
                .cards(cards)
                .build();
    }

    // Dùng thẻ con đã được join fetch sẵn trong Area.cardList (đã sắp xếp theo position)
    public static AreaResponse from(Area area) {
        List<CardResponse> cards = area.getCardList().stream()
                .map(CardResponse::fromEntity)
                .toList();
        return fromEntity(area, cards);
    }
}
