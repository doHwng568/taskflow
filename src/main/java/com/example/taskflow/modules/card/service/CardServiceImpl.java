package com.example.taskflow.modules.card.service;

import com.example.taskflow.common.enums.ErrorCode;
import com.example.taskflow.common.enums.Role;
import com.example.taskflow.common.enums.TaskPriority;
import com.example.taskflow.common.enums.TaskType;
import com.example.taskflow.common.exception.BusinessException;
import com.example.taskflow.entity.Area;
import com.example.taskflow.entity.Card;
import com.example.taskflow.entity.CardActivity;
import com.example.taskflow.entity.CardMovement;
import com.example.taskflow.entity.User;
import com.example.taskflow.modules.area.Repositories.AreaRepository;
import com.example.taskflow.modules.card.repositories.CardActivityRepository;
import com.example.taskflow.modules.card.repositories.CardRepository;
import com.example.taskflow.modules.card.dto.*;
import com.example.taskflow.modules.cardmovement.Repositories.CardMovementRepository;
import com.example.taskflow.modules.workspace.Repositories.WorkspaceMemberRepository;
import com.example.taskflow.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
public class CardServiceImpl implements CardService {

    private String formatDueDateVi(LocalDateTime date) {
        if (date == null) return "";
        LocalDate today = LocalDate.now();
        LocalDate target = date.toLocalDate();
        String timeStr = date.format(DateTimeFormatter.ofPattern("HH:mm"));
        if (target.equals(today)) {
            return "Hôm nay lúc " + timeStr;
        } else if (target.equals(today.plusDays(1))) {
            return "Ngày mai lúc " + timeStr;
        } else if (target.equals(today.minusDays(1))) {
            return "Hôm qua lúc " + timeStr;
        } else if (target.getYear() == today.getYear()) {
            return target.getDayOfMonth() + " thg " + target.getMonthValue() + " lúc " + timeStr;
        } else {
            return target.getDayOfMonth() + " thg " + target.getMonthValue() + ", " + target.getYear() + " lúc " + timeStr;
        }
    }


    private final CardRepository cardRepository;
    private final AreaRepository areaRepository;
    private final CardMovementRepository cardMovementRepository;
    private final CardActivityRepository cardActivityRepository;
    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

    public CardServiceImpl(
            CardRepository cardRepository,
            AreaRepository areaRepository,
            CardMovementRepository cardMovementRepository,
            CardActivityRepository cardActivityRepository,
            UserRepository userRepository,
            WorkspaceMemberRepository workspaceMemberRepository
    ) {
        this.cardRepository = cardRepository;
        this.areaRepository = areaRepository;
        this.cardMovementRepository = cardMovementRepository;
        this.cardActivityRepository = cardActivityRepository;
        this.userRepository = userRepository;
        this.workspaceMemberRepository = workspaceMemberRepository;
    }

    private User findCurrentUser(String username) {
        if (username == null || username.isBlank() || "anonymousUser".equals(username)) {
            return null;
        }
        return userRepository.findByUsername(username).orElse(null);
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
        return createCard(request, null);
    }

    @Override
    @Transactional
    public CardResponse createCard(CreateCardRequest request, String username) {
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

        User currentUser = findCurrentUser(username);
        if (currentUser != null) {
            card.setCreatedBy(currentUser);
        }

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

        // Lưu hoạt động tạo thẻ
        CardActivity activity = new CardActivity();
        activity.setCard(savedCard);
        activity.setUser(currentUser);
        activity.setActionType("CREATED");
        activity.setDescription("đã tạo thẻ này");
        activity.setCreatedAt(now);
        cardActivityRepository.save(activity);

        return CardResponse.fromEntity(savedCard);
    }

    @Override
    @Transactional
    public CardResponse updateCard(Long cardId, UpdateCardRequest request) {
        return updateCard(cardId, request, null);
    }

    @Override
    @Transactional
    public CardResponse updateCard(Long cardId, UpdateCardRequest request, String username) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CARD_NOT_FOUND));

        User currentUser = findCurrentUser(username);

        // Theo dõi thay đổi để tạo mô tả hoạt động
        List<String> changes = new ArrayList<>();
        String newTitle = request.getTitle() != null ? request.getTitle().trim() : card.getTitle();
        boolean titleChanged = !Objects.equals(card.getTitle(), newTitle);
        if (titleChanged) {
            if (currentUser == null || currentUser.getRole() != Role.PM) {
                throw new BusinessException(ErrorCode.ACCESS_DENIED);
            }
        }
        String newContent = request.getContent() != null ? request.getContent().trim() : "";
        String oldContent = card.getContent() != null ? card.getContent().trim() : "";
        if (!Objects.equals(oldContent, newContent)) {
            changes.add("mô tả");
        }
        if (request.getPriority() != null && !Objects.equals(card.getPriority(), request.getPriority())) {
            changes.add("mức độ ưu tiên thành " + request.getPriority());
        }
        if (request.getType() != null && !Objects.equals(card.getType(), request.getType())) {
            changes.add("loại thẻ thành " + request.getType());
        }
        String dateChangeAction = null;
        boolean dueDateChanged = false;
        if (request.getDueDate() != null && card.getDueDate() != null) {
            dueDateChanged = !card.getDueDate().withNano(0).isEqual(request.getDueDate().withNano(0));
        } else if (request.getDueDate() != null || card.getDueDate() != null) {
            dueDateChanged = true;
        }

        if (dueDateChanged) {
            if (request.getDueDate() == null) {
                dateChangeAction = "đã gỡ bỏ ngày hết hạn khỏi thẻ này";
                changes.add("xóa hạn chót");
            } else if (card.getDueDate() == null) {
                dateChangeAction = "đã đặt ngày hết hạn cho thẻ này là " + formatDueDateVi(request.getDueDate());
                changes.add("hạn chót là " + formatDueDateVi(request.getDueDate()));
            } else {
                dateChangeAction = "đã thay đổi ngày hết hạn của thẻ này thành " + formatDueDateVi(request.getDueDate());
                changes.add("hạn chót thành " + formatDueDateVi(request.getDueDate()));
            }
        }
        if (request.getCoverImage() != null && !Objects.equals(card.getCoverImage(), request.getCoverImage())) {
            changes.add("ảnh bìa");
        }
        if (request.getArchived() != null && card.isArchived() != request.getArchived()) {
            changes.add(request.getArchived() ? "lưu trữ thẻ" : "khôi phục thẻ");
        }
        if (request.getAssigneeId() != null) {
            Long currentAssigneeId = card.getAssignee() != null ? card.getAssignee().getId() : null;
            if (request.getAssigneeId() <= 0) {
                if (currentAssigneeId != null) {
                    if (currentUser == null || currentUser.getRole() != Role.PM) {
                        throw new BusinessException(ErrorCode.ACCESS_DENIED);
                    }
                    card.setAssignee(null);
                    changes.add("xóa người thực hiện");
                }
            } else if (!Objects.equals(currentAssigneeId, request.getAssigneeId())) {
                if (currentUser == null || currentUser.getRole() != Role.PM) {
                    throw new BusinessException(ErrorCode.ACCESS_DENIED);
                }
                User newAssignee = userRepository.findById(request.getAssigneeId())
                        .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
                String name = newAssignee.getFullName() != null && !newAssignee.getFullName().isBlank()
                        ? newAssignee.getFullName()
                        : newAssignee.getUsername();
                String roleName = newAssignee.getRole() != null ? " (" + newAssignee.getRole() + ")" : "";
                changes.add("người thực hiện thành " + name + roleName);
                card.setAssignee(newAssignee);
            }
        }
        boolean commentsChanged = false;
        if (request.getComments() != null && !Objects.equals(card.getComments(), request.getComments())) {
            commentsChanged = true;
        }

        // Cập nhật thẻ
        card.setTitle(newTitle);
        if (request.getContent() != null) {
            card.setContent(newContent);
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

        LocalDateTime now = LocalDateTime.now();
        card.setUpdatedAt(now);
        if (currentUser != null) {
            card.setUpdatedBy(currentUser);
        }

        Card updatedCard = cardRepository.save(card);

        // Lưu hoạt động sửa thẻ (không ghi lịch sử khi chỉ đổi tiêu đề)
        if (!changes.isEmpty() || commentsChanged) {
            String desc;
            if (dateChangeAction != null && changes.size() == 1) {
                desc = dateChangeAction;
            } else if (!changes.isEmpty()) {
                desc = "đã cập nhật " + String.join(", ", changes);
            } else {
                desc = "đã cập nhật nhận xét của thẻ";
            }

            CardActivity activity = new CardActivity();
            activity.setCard(updatedCard);
            activity.setUser(currentUser);
            activity.setActionType("UPDATED");
            activity.setDescription(desc);
            activity.setCreatedAt(now);
            cardActivityRepository.save(activity);
        }

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

        // 6. Kiểm tra quyền của người dùng tại Workspace đích
        if (targetArea.getWorkspace() != null) {
            Long targetWorkspaceId = targetArea.getWorkspace().getId();
            Long userId = currentUser.getId();
            boolean isTargetMember = workspaceMemberRepository.existsByWorkspace_IdAndMember_Id(targetWorkspaceId, userId);
            if (!isTargetMember) {
                throw new BusinessException(ErrorCode.NOT_WORKSPACE_MEMBER);
            }
        }

        // 7. Cập nhật Area của Card
        card.setArea(targetArea);

        LocalDateTime now = LocalDateTime.now();
        card.setUpdatedAt(now);
        card.setUpdatedBy(currentUser);

        // 9. Xử lý position trong Area đích
        List<Card> targetCards = new ArrayList<>(
                cardRepository.findByArea_IdOrderByPositionAsc(targetArea.getId())
        );
        targetCards.removeIf(c -> c.getId().equals(card.getId()));

        if (request.getPosition() != null) {
            int insertIndex = Math.max(0, Math.min(request.getPosition().intValue() - 1, targetCards.size()));
            targetCards.add(insertIndex, card);
            for (int i = 0; i < targetCards.size(); i++) {
                targetCards.get(i).setPosition((double) (i + 1));
            }
            cardRepository.saveAll(targetCards);
        } else {
            double nextPos = targetCards.isEmpty()
                    ? 1.0
                    : (targetCards.get(targetCards.size() - 1).getPosition() != null
                            ? targetCards.get(targetCards.size() - 1).getPosition() + 1.0
                            : targetCards.size() + 1.0);
            card.setPosition(nextPos);
        }

        Card savedCard = cardRepository.save(card);

        // 10. Lưu lịch sử CardMovement
        CardMovement movement = new CardMovement();
        movement.setCard(savedCard);
        movement.setFromArea(fromArea);
        movement.setToArea(targetArea);
        movement.setMovedBy(currentUser);
        movement.setMovedAt(now);
        movement.setComment(request.getComment());
        cardMovementRepository.save(movement);

        // 11. Lưu lịch sử CardActivity
        String fromDesc = fromArea != null ? fromArea.getName() : "Chưa phân cột";
        String toDesc = targetArea.getName();
        if (fromArea != null && fromArea.getWorkspace() != null && targetArea.getWorkspace() != null
                && !fromArea.getWorkspace().getId().equals(targetArea.getWorkspace().getId())) {
            fromDesc += " (Bảng " + fromArea.getWorkspace().getName() + ")";
            toDesc += " (Bảng " + targetArea.getWorkspace().getName() + ")";
        }
        String moveDesc = "đã chuyển thẻ từ cột \"" + fromDesc
                + "\" sang cột \"" + toDesc + "\"";
        if (request.getComment() != null && !request.getComment().isBlank()) {
            moveDesc += " (Ghi chú: \"" + request.getComment().trim() + "\")";
        }
        CardActivity activity = new CardActivity();
        activity.setCard(savedCard);
        activity.setUser(currentUser);
        activity.setActionType("MOVED");
        activity.setDescription(moveDesc);
        activity.setCreatedAt(now);
        cardActivityRepository.save(activity);

        return CardResponse.fromEntity(savedCard);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CardMovementResponse> getCardMovements(Long cardId) {
        if (!cardRepository.existsById(cardId)) {
            throw new BusinessException(ErrorCode.CARD_NOT_FOUND);
        }

        return cardMovementRepository.findByCard_IdOrderByMovedAtDesc(cardId)
                .stream()
                .map(CardMovementResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CardActivityResponse> getCardActivities(Long cardId) {
        if (!cardRepository.existsById(cardId)) {
            throw new BusinessException(ErrorCode.CARD_NOT_FOUND);
        }

        return cardActivityRepository.findByCard_IdOrderByCreatedAtDesc(cardId)
                .stream()
                .map(CardActivityResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public CardResponse archiveCard(Long cardId) {
        return archiveCard(cardId, null);
    }

    @Override
    @Transactional
    public CardResponse archiveCard(Long cardId, String username) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CARD_NOT_FOUND));
        User currentUser = findCurrentUser(username);

        card.setArchived(true);
        LocalDateTime now = LocalDateTime.now();
        card.setUpdatedAt(now);
        if (currentUser != null) {
            card.setUpdatedBy(currentUser);
        }
        Card savedCard = cardRepository.save(card);

        CardActivity activity = new CardActivity();
        activity.setCard(savedCard);
        activity.setUser(currentUser);
        activity.setActionType("ARCHIVED");
        activity.setDescription("đã lưu trữ thẻ này");
        activity.setCreatedAt(now);
        cardActivityRepository.save(activity);

        return CardResponse.fromEntity(savedCard);
    }

    @Override
    @Transactional
    public CardResponse restoreCard(Long cardId) {
        return restoreCard(cardId, null);
    }

    @Override
    @Transactional
    public CardResponse restoreCard(Long cardId, String username) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CARD_NOT_FOUND));
        User currentUser = findCurrentUser(username);

        card.setArchived(false);
        LocalDateTime now = LocalDateTime.now();
        card.setUpdatedAt(now);
        if (currentUser != null) {
            card.setUpdatedBy(currentUser);
        }
        Card savedCard = cardRepository.save(card);

        CardActivity activity = new CardActivity();
        activity.setCard(savedCard);
        activity.setUser(currentUser);
        activity.setActionType("RESTORED");
        activity.setDescription("đã khôi phục thẻ này");
        activity.setCreatedAt(now);
        cardActivityRepository.save(activity);

        return CardResponse.fromEntity(savedCard);
    }

    @Override
    @Transactional
    public void deleteCard(Long cardId) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CARD_NOT_FOUND));

        cardActivityRepository.deleteByCardId(cardId);

        List<CardMovement> movements = cardMovementRepository.findByCard_IdOrderByMovedAtDesc(cardId);
        if (!movements.isEmpty()) {
            cardMovementRepository.deleteAll(movements);
        }
        cardRepository.delete(card);
    }
}
