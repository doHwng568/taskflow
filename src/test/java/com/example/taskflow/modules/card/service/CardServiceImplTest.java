package com.example.taskflow.modules.card.service;

import com.example.taskflow.common.enums.ErrorCode;
import com.example.taskflow.common.exception.BusinessException;
import com.example.taskflow.entity.Area;
import com.example.taskflow.entity.Card;
import com.example.taskflow.entity.CardMovement;
import com.example.taskflow.entity.User;
import com.example.taskflow.entity.Workspace;
import com.example.taskflow.modules.area.Repositories.AreaRepository;
import com.example.taskflow.modules.card.dto.CardResponse;
import com.example.taskflow.modules.card.dto.MoveCardRequest;
import com.example.taskflow.modules.card.repositories.CardRepository;
import com.example.taskflow.modules.cardmovement.Repositories.CardMovementRepository;
import com.example.taskflow.modules.workspace.Repositories.WorkspaceMemberRepository;
import com.example.taskflow.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CardServiceImplTest {

    @Mock
    private CardRepository cardRepository;

    @Mock
    private AreaRepository areaRepository;

    @Mock
    private CardMovementRepository cardMovementRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private WorkspaceMemberRepository workspaceMemberRepository;

    @InjectMocks
    private CardServiceImpl cardService;

    private Workspace workspace;
    private Area fromArea;
    private Area toArea;
    private Card card;
    private User currentUser;

    @BeforeEach
    void setUp() {
        workspace = new Workspace();
        workspace.setId(10L);
        workspace.setName("Test Workspace");

        fromArea = new Area();
        fromArea.setId(1L);
        fromArea.setName("To Do");
        fromArea.setWorkspace(workspace);

        toArea = new Area();
        toArea.setId(2L);
        toArea.setName("In Progress");
        toArea.setWorkspace(workspace);

        card = new Card();
        card.setId(100L);
        card.setTitle("Test Card");
        card.setArea(fromArea);
        card.setPosition(1.0);

        currentUser = new User();
        currentUser.setId(5L);
        currentUser.setUsername("john_doe");
    }

    @Test
    @DisplayName("Case 1: Card không tồn tại -> CARD_NOT_FOUND")
    void testMoveCard_CardNotFound() {
        when(cardRepository.findById(999L)).thenReturn(Optional.empty());

        MoveCardRequest request = new MoveCardRequest();
        request.setTargetAreaId(2L);

        BusinessException ex = assertThrows(BusinessException.class, () ->
                cardService.moveCard(999L, request, "john_doe")
        );

        assertEquals(ErrorCode.CARD_NOT_FOUND, ex.getErrorCode());
        verify(cardMovementRepository, never()).save(any());
    }

    @Test
    @DisplayName("Case 2: Area đích không tồn tại -> AREA_NOT_FOUND")
    void testMoveCard_TargetAreaNotFound() {
        when(cardRepository.findById(100L)).thenReturn(Optional.of(card));
        when(userRepository.findByUsername("john_doe")).thenReturn(Optional.of(currentUser));
        when(workspaceMemberRepository.existsByWorkspace_IdAndMember_Id(10L, 5L)).thenReturn(true);
        when(areaRepository.findById(999L)).thenReturn(Optional.empty());

        MoveCardRequest request = new MoveCardRequest();
        request.setTargetAreaId(999L);

        BusinessException ex = assertThrows(BusinessException.class, () ->
                cardService.moveCard(100L, request, "john_doe")
        );

        assertEquals(ErrorCode.AREA_NOT_FOUND, ex.getErrorCode());
        verify(cardMovementRepository, never()).save(any());
    }

    @Test
    @DisplayName("Case 3: User không phải Workspace member -> NOT_WORKSPACE_MEMBER")
    void testMoveCard_NotWorkspaceMember() {
        when(cardRepository.findById(100L)).thenReturn(Optional.of(card));
        when(userRepository.findByUsername("john_doe")).thenReturn(Optional.of(currentUser));
        when(workspaceMemberRepository.existsByWorkspace_IdAndMember_Id(10L, 5L)).thenReturn(false);

        MoveCardRequest request = new MoveCardRequest();
        request.setTargetAreaId(2L);

        BusinessException ex = assertThrows(BusinessException.class, () ->
                cardService.moveCard(100L, request, "john_doe")
        );

        assertEquals(ErrorCode.NOT_WORKSPACE_MEMBER, ex.getErrorCode());
        verify(cardMovementRepository, never()).save(any());
    }

    @Test
    @DisplayName("Case 4: User là Workspace member và di chuyển thành công")
    void testMoveCard_Success() {
        when(cardRepository.findById(100L)).thenReturn(Optional.of(card));
        when(userRepository.findByUsername("john_doe")).thenReturn(Optional.of(currentUser));
        when(workspaceMemberRepository.existsByWorkspace_IdAndMember_Id(10L, 5L)).thenReturn(true);
        when(areaRepository.findById(2L)).thenReturn(Optional.of(toArea));
        when(cardRepository.findByArea_IdOrderByPositionAsc(2L)).thenReturn(new ArrayList<>());
        when(cardRepository.save(any(Card.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MoveCardRequest request = new MoveCardRequest();
        request.setTargetAreaId(2L);
        request.setPosition(1.0);

        CardResponse response = cardService.moveCard(100L, request, "john_doe");

        assertNotNull(response);
        assertEquals(2L, response.getAreaId());

        ArgumentCaptor<CardMovement> movementCaptor = ArgumentCaptor.forClass(CardMovement.class);
        verify(cardMovementRepository).save(movementCaptor.capture());

        CardMovement savedMovement = movementCaptor.getValue();
        assertEquals(100L, savedMovement.getCard().getId());
        assertEquals(1L, savedMovement.getFromArea().getId());
        assertEquals(2L, savedMovement.getToArea().getId());
        assertEquals(currentUser, savedMovement.getMovedBy());
        assertNotNull(savedMovement.getMovedAt());
    }

    @Test
    @DisplayName("Case 5: Di chuyển card vào chính Area hiện tại -> CARD_ALREADY_IN_TARGET_AREA")
    void testMoveCard_AlreadyInTargetArea() {
        when(cardRepository.findById(100L)).thenReturn(Optional.of(card));
        when(userRepository.findByUsername("john_doe")).thenReturn(Optional.of(currentUser));
        when(workspaceMemberRepository.existsByWorkspace_IdAndMember_Id(10L, 5L)).thenReturn(true);
        when(areaRepository.findById(1L)).thenReturn(Optional.of(fromArea));

        MoveCardRequest request = new MoveCardRequest();
        request.setTargetAreaId(1L);

        BusinessException ex = assertThrows(BusinessException.class, () ->
                cardService.moveCard(100L, request, "john_doe")
        );

        assertEquals(ErrorCode.CARD_ALREADY_IN_TARGET_AREA, ex.getErrorCode());
        verify(cardMovementRepository, never()).save(any());
    }

    @Test
    @DisplayName("Case 6: Area đích thuộc Workspace khác -> VALIDATION_ERROR")
    void testMoveCard_TargetAreaDifferentWorkspace() {
        Workspace otherWorkspace = new Workspace();
        otherWorkspace.setId(99L);
        otherWorkspace.setName("Other Workspace");

        Area differentArea = new Area();
        differentArea.setId(3L);
        differentArea.setName("Other Area");
        differentArea.setWorkspace(otherWorkspace);

        when(cardRepository.findById(100L)).thenReturn(Optional.of(card));
        when(userRepository.findByUsername("john_doe")).thenReturn(Optional.of(currentUser));
        when(workspaceMemberRepository.existsByWorkspace_IdAndMember_Id(10L, 5L)).thenReturn(true);
        when(areaRepository.findById(3L)).thenReturn(Optional.of(differentArea));

        MoveCardRequest request = new MoveCardRequest();
        request.setTargetAreaId(3L);

        BusinessException ex = assertThrows(BusinessException.class, () ->
                cardService.moveCard(100L, request, "john_doe")
        );

        assertEquals(ErrorCode.VALIDATION_ERROR, ex.getErrorCode());
        verify(cardMovementRepository, never()).save(any());
    }

    @Test
    @DisplayName("Case 7: Comment null -> di chuyển thành công, comment là null")
    void testMoveCard_NullComment() {
        when(cardRepository.findById(100L)).thenReturn(Optional.of(card));
        when(userRepository.findByUsername("john_doe")).thenReturn(Optional.of(currentUser));
        when(workspaceMemberRepository.existsByWorkspace_IdAndMember_Id(10L, 5L)).thenReturn(true);
        when(areaRepository.findById(2L)).thenReturn(Optional.of(toArea));
        when(cardRepository.findByArea_IdOrderByPositionAsc(2L)).thenReturn(new ArrayList<>());
        when(cardRepository.save(any(Card.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MoveCardRequest request = new MoveCardRequest();
        request.setTargetAreaId(2L);
        request.setComment(null);

        cardService.moveCard(100L, request, "john_doe");

        ArgumentCaptor<CardMovement> captor = ArgumentCaptor.forClass(CardMovement.class);
        verify(cardMovementRepository).save(captor.capture());
        assertNull(captor.getValue().getComment());
    }

    @Test
    @DisplayName("Case 8: Comment có nội dung -> di chuyển thành công, comment được lưu đúng")
    void testMoveCard_WithComment() {
        when(cardRepository.findById(100L)).thenReturn(Optional.of(card));
        when(userRepository.findByUsername("john_doe")).thenReturn(Optional.of(currentUser));
        when(workspaceMemberRepository.existsByWorkspace_IdAndMember_Id(10L, 5L)).thenReturn(true);
        when(areaRepository.findById(2L)).thenReturn(Optional.of(toArea));
        when(cardRepository.findByArea_IdOrderByPositionAsc(2L)).thenReturn(new ArrayList<>());
        when(cardRepository.save(any(Card.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MoveCardRequest request = new MoveCardRequest();
        request.setTargetAreaId(2L);
        request.setComment("Moved to In Progress for review");

        cardService.moveCard(100L, request, "john_doe");

        ArgumentCaptor<CardMovement> captor = ArgumentCaptor.forClass(CardMovement.class);
        verify(cardMovementRepository).save(captor.capture());
        assertEquals("Moved to In Progress for review", captor.getValue().getComment());
    }

    @Test
    @DisplayName("Case 9: Không có Authentication / username rỗng -> ACCESS_DENIED")
    void testMoveCard_Unauthenticated() {
        MoveCardRequest request = new MoveCardRequest();
        request.setTargetAreaId(2L);

        BusinessException ex1 = assertThrows(BusinessException.class, () ->
                cardService.moveCard(100L, request, null)
        );
        assertEquals(ErrorCode.ACCESS_DENIED, ex1.getErrorCode());

        BusinessException ex2 = assertThrows(BusinessException.class, () ->
                cardService.moveCard(100L, request, "anonymousUser")
        );
        assertEquals(ErrorCode.ACCESS_DENIED, ex2.getErrorCode());

        BusinessException ex3 = assertThrows(BusinessException.class, () ->
                cardService.moveCard(100L, request, "   ")
        );
        assertEquals(ErrorCode.ACCESS_DENIED, ex3.getErrorCode());

        verify(cardMovementRepository, never()).save(any());
    }
}
