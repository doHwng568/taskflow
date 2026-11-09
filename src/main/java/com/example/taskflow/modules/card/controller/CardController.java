package com.example.taskflow.modules.card.controller;

import com.example.taskflow.common.dto.ApiResponse;
import com.example.taskflow.modules.card.dto.CardMovementResponse;
import com.example.taskflow.modules.card.dto.CreateCardRequest;
import com.example.taskflow.modules.card.dto.MoveCardRequest;
import com.example.taskflow.modules.card.dto.UpdateCardRequest;
import com.example.taskflow.modules.card.dto.CardResponse;
import com.example.taskflow.modules.card.service.CardService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cards")
public class CardController {

    private final CardService cardService;

    public CardController(CardService cardService) {
        this.cardService = cardService;
    }

    @GetMapping("/area/{areaId}")
    public ResponseEntity<ApiResponse<List<CardResponse>>> getCardsByArea(@PathVariable Long areaId) {
        List<CardResponse> cards = cardService.getCardsByArea(areaId);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(cards, "Get cards by area successfully"));
    }

    @GetMapping("/{cardId}")
    public ResponseEntity<ApiResponse<CardResponse>> getCardById(@PathVariable Long cardId) {
        CardResponse card = cardService.getCardById(cardId);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(card, "Get card detail successfully"));
    }

    @PreAuthorize("hasAuthority('CARD_CREATE')")
    @PostMapping
    public ResponseEntity<ApiResponse<CardResponse>> createCard(@Valid @RequestBody CreateCardRequest request) {
        CardResponse createdCard = cardService.createCard(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(createdCard, "Create card successfully"));
    }

    @PreAuthorize("hasAuthority('CARD_UPDATE')")
    @PutMapping("/{cardId}")
    public ResponseEntity<ApiResponse<CardResponse>> updateCard(
            @PathVariable Long cardId,
            @Valid @RequestBody UpdateCardRequest request
    ) {
        CardResponse updatedCard = cardService.updateCard(cardId, request);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(updatedCard, "Update card successfully"));
    }

    @PreAuthorize("hasAuthority('CARD_UPDATE')")
    @PutMapping("/{cardId}/move")
    public ResponseEntity<ApiResponse<CardResponse>> moveCard(
            @PathVariable Long cardId,
            @Valid @RequestBody MoveCardRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String username = userDetails != null ? userDetails.getUsername() : null;
        CardResponse movedCard = cardService.moveCard(cardId, request, username);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(movedCard, "Move card successfully"));
    }

    @GetMapping("/{cardId}/movements")
    public ResponseEntity<ApiResponse<List<CardMovementResponse>>> getCardMovements(@PathVariable Long cardId) {
        List<CardMovementResponse> movements = cardService.getCardMovements(cardId);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(movements, "Get card movements successfully"));
    }

    @PatchMapping("/{cardId}/archive")
    public ResponseEntity<ApiResponse<CardResponse>> archiveCard(@PathVariable Long cardId) {
        CardResponse archivedCard = cardService.archiveCard(cardId);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(archivedCard, "Archive card successfully"));
    }

    @PatchMapping("/{cardId}/restore")
    public ResponseEntity<ApiResponse<CardResponse>> restoreCard(@PathVariable Long cardId) {
        CardResponse restoredCard = cardService.restoreCard(cardId);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(restoredCard, "Restore card successfully"));
    }

    @PreAuthorize("hasAuthority('CARD_DELETE')")
    @DeleteMapping("/{cardId}")
    public ResponseEntity<ApiResponse<Void>> deleteCard(@PathVariable Long cardId) {
        cardService.deleteCard(cardId);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(null, "Delete card successfully"));
    }
}
