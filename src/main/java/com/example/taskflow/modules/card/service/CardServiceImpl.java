package com.example.taskflow.modules.card.service;

import com.example.taskflow.common.enums.ErrorCode;
import com.example.taskflow.common.enums.TaskPriority;
import com.example.taskflow.common.enums.TaskType;
import com.example.taskflow.common.exception.BusinessException;
import com.example.taskflow.entity.Area;
import com.example.taskflow.entity.Card;
import com.example.taskflow.entity.CardMovement;
import com.example.taskflow.entity.User;
import com.example.taskflow.modules.area.Repositories.AreaRepository;
import com.example.taskflow.modules.card.repositories.CardRepository;
import com.example.taskflow.modules.card.dto.CardMovementResponse;
import com.example.taskflow.modules.card.dto.CreateCardRequest;
import com.example.taskflow.modules.card.dto.MoveCardRequest;
import com.example.taskflow.modules.card.dto.UpdateCardRequest;
import com.example.taskflow.modules.card.dto.CardResponse;
import com.example.taskflow.modules.cardmovement.Repositories.CardMovementRepository;
import com.example.taskflow.modules.workspace.Repositories.WorkspaceMemberRepository;
import com.example.taskflow.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CardServiceImpl implements CardService {

    private final CardRepository cardRepository;
    private final AreaRepository areaRepository;
    private final CardMovementRepository cardMovementRepository;
    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

    public CardServiceImpl(
            CardRepository cardRepository,
            AreaRepository areaRepository,
            CardMovementRepository cardMovementRepository,
            UserRepository userRepository,
            WorkspaceMemberRepository workspaceMemberRepository
    ) {
        this.cardRepository = cardRepository;
        this.areaRepository = areaRepository;
        this.cardMovementRepository = cardMovementRepository;
        this.userRepository = userRepository;
        this.workspaceMemberRepository = workspaceMemberRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CardResponse> getCardsByArea(Long areaId) {
        return cardRepository.findByArea_IdOrderByPositionAsc(areaId)
                .stream()
                .map(CardResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CardResponse getCardById(Long cardId) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CARD_NOT_FOUND));
        return CardResponse.fromEntity(card);
    }

    @Override
    @Transactional
    public CardResponse createCard(CreateCardRequest request) {
        Card card = new Card();
        card.setTitle(request.getTitle().trim());
        card.setContent(request.getContent() != null ? request.getContent().trim() : "");
        card.setCoverImage(request.getCoverImage());
        card.setPriority(request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM);
        card.setType(request.getType() != null ? request.getType() : TaskType.DOCUMENTATION);
        card.setDueDate(request.getDueDate());

        LocalDateTime now = LocalDateTime.now();
        card.setCreatedAt(now);
        card.setUpdatedAt(now);

        if (request.getAreaId() != null) {
            Area area = areaRepository.findById(request.getAreaId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.AREA_NOT_FOUND));
            card.setArea(area);

            if (request.getPosition() != null) {
                card.setPosition(request.getPosition());
            } else {
                List<Card> existingCards = cardRepository.findByArea_IdOrderByPositionAsc(area.getId());
                double nextPos = existingCards.isEmpty()
                        ? 1.0
                        : (existingCards.get(existingCards.size() - 1).getPosition() != null
                                ? existingCards.get(existingCards.size() - 1).getPosition() + 1.0
                                : existingCards.size() + 1.0);
                card.setPosition(nextPos);
            }
        } else {
            card.setPosition(request.getPosition() != null ? request.getPosition() : 1.0);
        }

        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
            card.setAssignee(assignee);
        }

        Card savedCard = cardRepository.save(card);
        return CardResponse.fromEntity(savedCard);
    }

    @Override
    @Transactional
    public CardResponse updateCard(Long cardId, UpdateCardRequest request) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CARD_NOT_FOUND));

        card.setTitle(request.getTitle().trim());
        if (request.getContent() != null) {
            card.setContent(request.getContent().trim());
        }
        card.setCoverImage(request.getCoverImage());
        if (request.getComments() != null) {
            card.setComments(request.getComments());
        }
        if (request.getArchived() != null) {
            card.setArchived(request.getArchived());
        }
        if (request.getPosition() != null) {
            card.setPosition(request.getPosition());
        }
        if (request.getPriority() != null) {
            card.setPriority(request.getPriority());
        }
        if (request.getType() != null) {
            card.setType(request.getType());
        }
        card.setDueDate(request.getDueDate());

        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
            card.setAssignee(assignee);
        }

        card.setUpdatedAt(LocalDateTime.now());

        Card updatedCard = cardRepository.save(card);
        return CardResponse.fromEntity(updatedCard);
    }

    @Override
    @Transactional
    public CardResponse moveCard(Long cardId, MoveCardRequest request, String username) {
        // 1. Xác thực người dùng
        if (username == null || username.isBlank() || "anonymousUser".equals(username)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }

        // 2. Tìm card
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CARD_NOT_FOUND));

        // 3. Lấy Area hiện tại và kiểm tra membership
        Area fromArea = card.getArea();

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (fromArea != null && fromArea.getWorkspace() != null) {
            Long workspaceId = fromArea.getWorkspace().getId();
            Long userId = currentUser.getId();
            boolean isMember = workspaceMemberRepository.existsByWorkspace_IdAndMember_Id(workspaceId, userId);
            if (!isMember) {
                throw new BusinessException(ErrorCode.NOT_WORKSPACE_MEMBER);
            }
        }

        // 4. Tìm Area đích
        Area targetArea = areaRepository.findById(request.getTargetAreaId())
                .orElseThrow(() -> new BusinessException(ErrorCode.AREA_NOT_FOUND));

        // 5. Chặn di chuyển vào chính Area hiện tại
        if (fromArea != null && fromArea.getId().equals(targetArea.getId())) {
            throw new BusinessException(ErrorCode.CARD_ALREADY_IN_TARGET_AREA);
        }

        // 6. Kiểm tra Area đích thuộc cùng Workspace với Area hiện tại
        if (fromArea != null
                && fromArea.getWorkspace() != null
                && targetArea.getWorkspace() != null
                && !fromArea.getWorkspace().getId().equals(targetArea.getWorkspace().getId())) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }

        // 7. Cập nhật Area của Card
        card.setArea(targetArea);

        LocalDateTime now = LocalDateTime.now();
        card.setUpdatedAt(now);

        // 9. Xử lý position trong Area đích
        // Lấy danh sách card hiện có trong Area đích (loại trừ card đang di chuyển nếu có)
        List<Card> targetCards = new java.util.ArrayList<>(
                cardRepository.findByArea_IdOrderByPositionAsc(targetArea.getId())
        );
        targetCards.removeIf(c -> c.getId().equals(card.getId()));

        if (request.getPosition() != null) {
            // Chèn card vào vị trí yêu cầu rồi renumber toàn bộ
            int insertIndex = Math.max(0, Math.min(request.getPosition().intValue() - 1, targetCards.size()));
            targetCards.add(insertIndex, card);
            for (int i = 0; i < targetCards.size(); i++) {
                targetCards.get(i).setPosition((double) (i + 1));
            }
            cardRepository.saveAll(targetCards);
        } else {
            // Không có position → đặt card vào cuối
            double nextPos = targetCards.isEmpty()
                    ? 1.0
                    : (targetCards.get(targetCards.size() - 1).getPosition() != null
                            ? targetCards.get(targetCards.size() - 1).getPosition() + 1.0
                            : targetCards.size() + 1.0);
            card.setPosition(nextPos);
        }

        Card savedCard = cardRepository.save(card);

        // 10. Lưu lịch sử CardMovement (phải thực hiện trong cùng @Transactional)
        CardMovement movement = new CardMovement();
        movement.setCard(savedCard);
        movement.setFromArea(fromArea);
        movement.setToArea(targetArea);
        movement.setMovedBy(currentUser);
        movement.setMovedAt(now);
        movement.setComment(request.getComment());
        cardMovementRepository.save(movement);

        return CardResponse.fromEntity(savedCard);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CardMovementResponse> getCardMovements(Long cardId) {
        // Kiểm tra card có tồn tại không
        if (!cardRepository.existsById(cardId)) {
            throw new BusinessException(ErrorCode.CARD_NOT_FOUND);
        }

        return cardMovementRepository.findByCard_IdOrderByMovedAtDesc(cardId)
                .stream()
                .map(CardMovementResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public CardResponse archiveCard(Long cardId) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CARD_NOT_FOUND));
        card.setArchived(true);
        card.setUpdatedAt(LocalDateTime.now());
        return CardResponse.fromEntity(cardRepository.save(card));
    }

    @Override
    @Transactional
    public CardResponse restoreCard(Long cardId) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CARD_NOT_FOUND));
        card.setArchived(false);
        card.setUpdatedAt(LocalDateTime.now());
        return CardResponse.fromEntity(cardRepository.save(card));
    }

    @Override
    @Transactional
    public void deleteCard(Long cardId) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CARD_NOT_FOUND));
        List<CardMovement> movements = cardMovementRepository.findByCard_IdOrderByMovedAtDesc(cardId);
        if (!movements.isEmpty()) {
            cardMovementRepository.deleteAll(movements);
        }
        cardRepository.delete(card);
    }
}
