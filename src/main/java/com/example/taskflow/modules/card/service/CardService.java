package com.example.taskflow.modules.card.service;

import com.example.taskflow.modules.card.dto.CardMovementResponse;
import com.example.taskflow.modules.card.dto.CreateCardRequest;
import com.example.taskflow.modules.card.dto.MoveCardRequest;
import com.example.taskflow.modules.card.dto.UpdateCardRequest;
import com.example.taskflow.modules.card.dto.CardResponse;

import java.util.List;

public interface CardService {

    List<CardResponse> getCardsByArea(Long areaId);

    CardResponse getCardById(Long cardId);

    CardResponse createCard(CreateCardRequest request);

    CardResponse updateCard(Long cardId, UpdateCardRequest request);

    CardResponse moveCard(Long cardId, MoveCardRequest request, String username);

    List<CardMovementResponse> getCardMovements(Long cardId);

    void deleteCard(Long cardId);
}
