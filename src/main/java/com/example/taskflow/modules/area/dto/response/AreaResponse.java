package com.example.taskflow.modules.area.dto.response;

import com.example.taskflow.entity.Area;

import java.util.List;

public record AreaResponse(
        Long id,
        String name,
        Double position,
        int cardCount,
        List<CardResponse> cards) {

    public static AreaResponse from(Area area) {
        List<CardResponse> cards = area.getCardList().stream()
                .map(CardResponse::from)
                .toList();

        return new AreaResponse(
                area.getId(),
                area.getName(),
                area.getPosition(),
                cards.size(),
                cards);
    }
}