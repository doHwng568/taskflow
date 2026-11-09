package com.example.taskflow.modules.card.service;

import com.example.taskflow.modules.card.dto.*;

import java.util.List;

public interface CardService {

    List<CardResponse> getCardsByArea(Long areaId);

    CardResponse getCardById(Long cardId);

    CardResponse createCard(CreateCardRequest request);

    CardResponse createCard(CreateCardRequest request, String username);

    CardResponse updateCard(Long cardId, UpdateCardRequest request);

    CardResponse updateCard(Long cardId, UpdateCardRequest request, String username);

    CardResponse moveCard(Long cardId, MoveCardRequest request, String username);

    List<CardMovementResponse> getCardMovements(Long cardId);

    List<CardActivityResponse> getCardActivities(Long cardId);

    CardResponse archiveCard(Long cardId);

    CardResponse archiveCard(Long cardId, String username);

    CardResponse restoreCard(Long cardId);

    CardResponse restoreCard(Long cardId, String username);

    void deleteCard(Long cardId);
}
