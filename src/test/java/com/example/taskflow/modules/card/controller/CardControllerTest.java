package com.example.taskflow.modules.card.controller;

import com.example.taskflow.common.dto.ApiResponse;
import com.example.taskflow.common.enums.ErrorCode;
import com.example.taskflow.common.exception.BusinessException;
import com.example.taskflow.modules.card.dto.CardResponse;
import com.example.taskflow.modules.card.dto.MoveCardRequest;
import com.example.taskflow.modules.card.service.CardService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CardControllerTest {

    @Mock
    private CardService cardService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private CardController cardController;

    @Test
    @DisplayName("moveCard khi Authentication là null -> ACCESS_DENIED")
    void testMoveCard_NullAuthentication() {
        MoveCardRequest request = new MoveCardRequest();
        request.setTargetAreaId(2L);

        BusinessException ex = assertThrows(BusinessException.class, () ->
                cardController.moveCard(100L, request, null)
        );

        assertEquals(ErrorCode.ACCESS_DENIED, ex.getErrorCode());
        verify(cardService, never()).moveCard(anyLong(), any(), anyString());
    }

    @Test
    @DisplayName("moveCard khi Authentication là anonymousUser -> ACCESS_DENIED")
    void testMoveCard_AnonymousUser() {
        MoveCardRequest request = new MoveCardRequest();
        request.setTargetAreaId(2L);

        when(authentication.getName()).thenReturn("anonymousUser");

        BusinessException ex = assertThrows(BusinessException.class, () ->
                cardController.moveCard(100L, request, authentication)
        );

        assertEquals(ErrorCode.ACCESS_DENIED, ex.getErrorCode());
        verify(cardService, never()).moveCard(anyLong(), any(), anyString());
    }

    @Test
    @DisplayName("moveCard khi authenticated hợp lệ -> gọi cardService.moveCard thành công")
    void testMoveCard_ValidAuthentication() {
        MoveCardRequest request = new MoveCardRequest();
        request.setTargetAreaId(2L);

        when(authentication.getName()).thenReturn("john_doe");
        when(authentication.isAuthenticated()).thenReturn(true);

        CardResponse mockResponse = CardResponse.builder()
                .id(100L)
                .areaId(2L)
                .build();

        when(cardService.moveCard(100L, request, "john_doe")).thenReturn(mockResponse);

        ResponseEntity<ApiResponse<CardResponse>> responseEntity =
                cardController.moveCard(100L, request, authentication);

        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertNotNull(responseEntity.getBody());
        assertEquals("6868", responseEntity.getBody().getCode());
        assertEquals(2L, responseEntity.getBody().getData().getAreaId());
        verify(cardService, times(1)).moveCard(100L, request, "john_doe");
    }
}
