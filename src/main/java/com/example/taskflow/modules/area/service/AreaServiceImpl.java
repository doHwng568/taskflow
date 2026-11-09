package com.example.taskflow.modules.area.service;

import com.example.taskflow.common.enums.ErrorCode;
import com.example.taskflow.common.exception.BusinessException;
import com.example.taskflow.entity.Area;
import com.example.taskflow.entity.Card;
import com.example.taskflow.entity.Workspace;
import com.example.taskflow.modules.area.Repositories.AreaRepository;
import com.example.taskflow.modules.area.dto.AreaResponse;
import com.example.taskflow.modules.area.dto.CreateAreaRequest;
import com.example.taskflow.modules.area.dto.UpdateAreaRequest;
import com.example.taskflow.modules.area.dto.request.CopyAreaRequest;
import com.example.taskflow.modules.area.dto.request.CreateWorkspaceAreaRequest;
import com.example.taskflow.modules.area.dto.request.MoveAreaRequest;
import com.example.taskflow.modules.area.dto.request.MoveAreaToWorkspaceRequest;
import com.example.taskflow.modules.area.dto.request.PinAreaRequest;
import com.example.taskflow.modules.area.dto.request.RenameAreaRequest;
import com.example.taskflow.modules.area.dto.request.UpdateAreaColorRequest;
import com.example.taskflow.modules.card.dto.CardResponse;
import com.example.taskflow.modules.card.repositories.CardRepository;
import com.example.taskflow.modules.cardmovement.Repositories.CardMovementRepository;
import com.example.taskflow.modules.workspace.Repositories.WorkspaceRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class AreaServiceImpl implements AreaService {

    private static final List<String> DEFAULT_AREA_NAMES = List.of("Cần làm", "Đang làm", "Đã xong");

    // Khoảng cách giữa các area liền kề. Chừa chỗ trống để kéo thả chỉ cần
    // lấy trung bình hai position, không phải đánh số lại cả hàng.
    private static final double POSITION_STEP = 1000.0;

    // Nếu hai area liền kề gần nhau hơn mức này thì trung bình không còn chính xác
    // (số thực hết độ phân giải) -> phải đánh số lại cả workspace.
    private static final double MIN_POSITION_GAP = 1e-6;

    private final AreaRepository areaRepository;
    private final CardRepository cardRepository;
    private final CardMovementRepository cardMovementRepository;
    private final WorkspaceRepository workspaceRepository;

    public AreaServiceImpl(
            AreaRepository areaRepository,
            CardRepository cardRepository,
            CardMovementRepository cardMovementRepository,
            WorkspaceRepository workspaceRepository
    ) {
        this.areaRepository = areaRepository;
        this.cardRepository = cardRepository;
        this.cardMovementRepository = cardMovementRepository;
        this.workspaceRepository = workspaceRepository;
    }

    // =====================================================================
    // API chung /api/areas (nhánh develop)
    // =====================================================================

    @Override
    @Transactional
    public List<AreaResponse> getAreas(Long workspaceId) {
        List<Area> areas;
        if (workspaceId != null) {
            areas = areaRepository.findByWorkspace_IdOrderByPositionAsc(workspaceId);
        } else {
            areas = areaRepository.findAll(Sort.by(Sort.Direction.ASC, "position", "id"));
            if (areas.isEmpty()) {
                areas = seedDefaultAreas();
            }
        }

        // Area đã lưu trữ không hiện trên board
        return areas.stream()
                .filter(area -> !area.isArchived())
                .map(area -> {
                    List<CardResponse> cards = cardRepository.findByArea_IdOrderByPositionAsc(area.getId())
                            .stream()
                            .map(CardResponse::fromEntity)
                            .toList();
                    return AreaResponse.fromEntity(area, cards);
                })
                .toList();
    }

    private List<Area> seedDefaultAreas() {
        LocalDateTime now = LocalDateTime.now();
        List<Area> defaults = new ArrayList<>();
        for (int i = 0; i < DEFAULT_AREA_NAMES.size(); i++) {
            Area area = new Area();
            area.setName(DEFAULT_AREA_NAMES.get(i));
            area.setPosition((double) (i + 1));
            area.setCreatedAt(now);
            area.setUpdatedAt(now);
            defaults.add(areaRepository.save(area));
        }
        return defaults;
    }

    @Override
    @Transactional
    public AreaResponse createArea(CreateAreaRequest request) {
        Area area = new Area();
        area.setName(request.getName().trim());

        LocalDateTime now = LocalDateTime.now();
        area.setCreatedAt(now);
        area.setUpdatedAt(now);

        if (request.getWorkspaceId() != null) {
            Workspace workspace = workspaceRepository.findById(request.getWorkspaceId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.WORKSPACE_NOT_FOUND));
            area.setWorkspace(workspace);
        }

        if (request.getPosition() != null) {
            area.setPosition(request.getPosition());
        } else {
            long count = areaRepository.count();
            area.setPosition((double) (count + 1));
        }

        Area savedArea = areaRepository.save(area);
        return AreaResponse.fromEntity(savedArea, List.of());
    }

    @Override
    @Transactional
    public AreaResponse updateArea(Long areaId, UpdateAreaRequest request) {
        Area area = findAreaOrThrow(areaId);

        if (request.getName() != null && !request.getName().isBlank()) {
            area.setName(request.getName().trim());
        }
        if (request.getPosition() != null) {
            area.setPosition(request.getPosition());
        }
        area.setUpdatedAt(LocalDateTime.now());

        Area savedArea = areaRepository.save(area);
        List<CardResponse> cards = cardRepository.findByArea_IdOrderByPositionAsc(savedArea.getId())
                .stream()
                .map(CardResponse::fromEntity)
                .toList();
        return AreaResponse.fromEntity(savedArea, cards);
    }

    // Xóa hẳn area cùng toàn bộ thẻ trong area. Thứ tự bắt buộc vì có khóa ngoại.
    // Dùng chung cho DELETE /api/areas/{id} và DELETE /areas/{id}.
    @Override
    @Transactional
    public void deleteArea(Long areaId) {
        if (!areaRepository.existsById(areaId)) {
            throw new BusinessException(ErrorCode.AREA_NOT_FOUND);
        }

        cardMovementRepository.deleteByCardsInArea(areaId);
        cardMovementRepository.clearFromArea(areaId);
        cardMovementRepository.clearToArea(areaId);
        cardRepository.bulkDeleteByAreaId(areaId);
        areaRepository.deleteById(areaId);
    }

    // =====================================================================
    // API theo workspace (nhánh feature/area-*)
    // =====================================================================

    // ----- lấy danh sách -----

    @Override
    @Transactional(readOnly = true)
    public List<AreaResponse> getAreasByWorkspace(Long workspaceId) {
        checkWorkspaceExists(workspaceId);

        return areaRepository.findActiveWithCards(workspaceId).stream()
                .map(AreaResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AreaResponse> getArchivedAreasByWorkspace(Long workspaceId) {
        checkWorkspaceExists(workspaceId);

        return areaRepository.findArchivedWithCards(workspaceId).stream()
                .map(AreaResponse::from)
                .toList();
    }

    // ----- tạo -----

    @Override
    @Transactional
    public AreaResponse createAreaInWorkspace(Long workspaceId, CreateWorkspaceAreaRequest request) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WORKSPACE_NOT_FOUND));

        double position = areaRepository.findMaxPositionByWorkspaceId(workspaceId)
                .map(max -> max + POSITION_STEP)
                .orElse(POSITION_STEP);

        LocalDateTime now = LocalDateTime.now();

        Area area = new Area();
        area.setName(request.name().trim());
        area.setPosition(position);
        area.setWorkspace(workspace);
        area.setCreatedAt(now);
        area.setUpdatedAt(now);

        return AreaResponse.from(areaRepository.save(area));
    }

    // ----- đổi tên -----

    @Override
    @Transactional
    public AreaResponse renameArea(Long areaId, RenameAreaRequest request) {
        Area area = findAreaOrThrow(areaId);

        area.setName(request.name().trim());
        area.setUpdatedAt(LocalDateTime.now());

        return AreaResponse.from(areaRepository.save(area));
    }

    // ----- lưu trữ / khôi phục -----

    @Override
    @Transactional
    public AreaResponse archiveArea(Long areaId) {
        return setArchived(areaId, true);
    }

    // Khôi phục area về cuối board (tránh xung đột vị trí với các area đã rebalance)
    @Override
    @Transactional
    public AreaResponse restoreArea(Long areaId) {
        Area area = findAreaOrThrow(areaId);
        Long workspaceId = area.getWorkspace().getId();

        double position = areaRepository.findMaxPositionByWorkspaceId(workspaceId)
                .map(max -> max + POSITION_STEP)
                .orElse(POSITION_STEP);

        area.setArchived(false);
        area.setPosition(position);
        area.setUpdatedAt(LocalDateTime.now());

        return AreaResponse.from(areaRepository.save(area));
    }

    private AreaResponse setArchived(Long areaId, boolean archived) {
        Area area = findAreaOrThrow(areaId);

        area.setArchived(archived);
        area.setUpdatedAt(LocalDateTime.now());

        return AreaResponse.from(areaRepository.save(area));
    }

    // ----- đổi màu -----

    // request.color() = null nghĩa là bỏ màu
    @Override
    @Transactional
    public AreaResponse updateAreaColor(Long areaId, UpdateAreaColorRequest request) {
        Area area = findAreaOrThrow(areaId);

        area.setColor(request.color());
        area.setUpdatedAt(LocalDateTime.now());

        return AreaResponse.from(areaRepository.save(area));
    }

    // ----- kéo thả đổi thứ tự -----

    // Đặt area vào giữa previousArea và nextArea (null = đầu/cuối hàng).
    @Override
    @Transactional
    public AreaResponse moveArea(Long areaId, MoveAreaRequest request) {
        Area area = findAreaOrThrow(areaId);
        Long workspaceId = area.getWorkspace() != null ? area.getWorkspace().getId() : null;

        Area previous = loadNeighbor(request.previousAreaId(), area, workspaceId);
        Area next = loadNeighbor(request.nextAreaId(), area, workspaceId);

        if (previous != null && next != null &&
                (previous.getPosition() == null || next.getPosition() == null || previous.getPosition() >= next.getPosition())) {
            rebalance(workspaceId);
        }

        Double newPosition = calculatePosition(previous, next);

        if (newPosition == null) {
            rebalance(workspaceId);
            newPosition = calculatePosition(previous, next);
        }

        area.setPosition(newPosition != null ? newPosition : POSITION_STEP);
        area.setUpdatedAt(LocalDateTime.now());

        return AreaResponse.from(areaRepository.save(area));
    }

    // Trả về null nếu khoảng cách giữa hai bên quá nhỏ (cần đánh số lại)
    private Double calculatePosition(Area previous, Area next) {
        if (previous == null && next == null) {
            return POSITION_STEP;
        }
        if (previous == null) {
            // Lên đầu hàng: lấy một nửa của next nếu next > 0 để luôn giữ position dương
            double nextPos = next.getPosition() != null ? next.getPosition() : POSITION_STEP * 2;
            if (nextPos > 0) {
                double half = nextPos / 2.0;
                return half < MIN_POSITION_GAP ? null : half;
            }
            return null; // Cần rebalance nếu next <= 0
        }
        if (next == null) {
            double prevPos = previous.getPosition() != null ? previous.getPosition() : POSITION_STEP;
            return prevPos + POSITION_STEP;      // xuống cuối hàng
        }
        if (previous.getPosition() == null || next.getPosition() == null) {
            return null;
        }
        if (next.getPosition() - previous.getPosition() < MIN_POSITION_GAP) {
            return null;
        }
        return (previous.getPosition() + next.getPosition()) / 2;
    }

    // Đánh số lại toàn bộ area của workspace: 1000, 2000, 3000... theo thứ tự: ghim trước, sau đó theo position
    private void rebalance(Long workspaceId) {
        List<Area> areas = workspaceId != null
                ? areaRepository.findByWorkspace_IdOrderByPinnedDescPositionAsc(workspaceId)
                : areaRepository.findAll(Sort.by(Sort.Direction.DESC, "pinned").and(Sort.by(Sort.Direction.ASC, "position", "id")));

        double position = POSITION_STEP;
        for (Area a : areas) {
            a.setPosition(position);
            position += POSITION_STEP;
        }
        areaRepository.saveAll(areas);
    }

    private Area loadNeighbor(Long neighborId, Area moved, Long workspaceId) {
        if (neighborId == null) {
            return null;
        }
        if (neighborId.equals(moved.getId())) {
            throw new BusinessException(ErrorCode.AREA_INVALID_POSITION);
        }

        Area neighbor = findAreaOrThrow(neighborId);

        if (workspaceId != null && neighbor.getWorkspace() != null &&
                !neighbor.getWorkspace().getId().equals(workspaceId)) {
            throw new BusinessException(ErrorCode.AREA_INVALID_POSITION);
        }
        // Area ghim và không ghim là hai nhóm riêng, không kéo xen kẽ nhau
        if (neighbor.isPinned() != moved.isPinned()) {
            throw new BusinessException(ErrorCode.AREA_INVALID_POSITION);
        }
        return neighbor;
    }

    // ----- ghim / bỏ ghim -----

    @Override
    @Transactional
    public AreaResponse pinArea(Long areaId, PinAreaRequest request) {
        Area area = findAreaOrThrow(areaId);
        boolean newPinned = Boolean.TRUE.equals(request.pinned());

        if (area.isPinned() != newPinned) {
            area.setPinned(newPinned);
            Long workspaceId = area.getWorkspace().getId();
            double position = areaRepository.findMaxPositionByWorkspaceId(workspaceId)
                    .map(max -> max + POSITION_STEP)
                    .orElse(POSITION_STEP);
            area.setPosition(position);
            area.setUpdatedAt(LocalDateTime.now());
        }

        return AreaResponse.from(areaRepository.save(area));
    }

    // ----- sao chép -----

    // Tạo bản sao ngay sau area gốc: cùng màu, cùng toàn bộ thẻ (thẻ mới, giữ nguyên thứ tự).
    // Bản sao không ghim và không lưu trữ.
    @Override
    @Transactional
    public AreaResponse copyArea(Long areaId) {
        return copyArea(areaId, null);
    }

    @Override
    @Transactional
    public AreaResponse copyArea(Long areaId, CopyAreaRequest request) {
        Area source = findAreaOrThrow(areaId);
        if (source.getWorkspace() == null) {
            throw new BusinessException(ErrorCode.AREA_NO_WORKSPACE);
        }
        Long workspaceId = source.getWorkspace().getId();

        // Area đứng liền sau area gốc (theo position) để chèn bản sao vào giữa
        Area next = areaRepository.findByWorkspace_IdOrderByPositionAsc(workspaceId).stream()
                .filter(a -> a.getPosition() > source.getPosition())
                .findFirst()
                .orElse(null);

        Double position = calculatePosition(source, next);
        if (position == null) {
            rebalance(workspaceId);
            position = calculatePosition(source, next);
        }

        String copyName;
        if (request != null && request.name() != null && !request.name().isBlank()) {
            copyName = request.name().trim();
            if (copyName.length() > 100) {
                copyName = copyName.substring(0, 100);
            }
        } else {
            copyName = source.getName();
            if (copyName.length() > 240) {
                copyName = copyName.substring(0, 240);
            }
            copyName = copyName + " (bản sao)";
        }

        LocalDateTime now = LocalDateTime.now();

        Area copy = new Area();
        copy.setName(copyName);
        copy.setPosition(position);
        copy.setColor(source.getColor());
        copy.setWorkspace(source.getWorkspace());
        copy.setCreatedAt(now);
        copy.setUpdatedAt(now);
        copy = areaRepository.save(copy);

        List<Card> copiedCards = new ArrayList<>();
        for (Card card : source.getCardList()) {
            Card cardCopy = new Card();
            cardCopy.setTitle(card.getTitle());
            cardCopy.setContent(card.getContent());
            cardCopy.setCoverImage(card.getCoverImage());
            cardCopy.setComments(null); // Thẻ mới bắt đầu cuộc thảo luận sạch
            cardCopy.setPosition(card.getPosition());
            cardCopy.setPriority(card.getPriority());
            cardCopy.setType(card.getType());
            cardCopy.setDueDate(card.getDueDate());
            cardCopy.setCreatedBy(card.getCreatedBy());
            cardCopy.setAssignee(card.getAssignee());
            cardCopy.setArea(copy);
            cardCopy.setCreatedAt(now);
            cardCopy.setUpdatedAt(now);
            copiedCards.add(cardCopy);
        }
        List<CardResponse> cards = cardRepository.saveAll(copiedCards).stream()
                .map(CardResponse::fromEntity)
                .toList();

        return AreaResponse.fromEntity(copy, cards);
    }

    // ----- chuyển sang workspace khác -----

    // Area đi cùng toàn bộ thẻ, xuống cuối board của workspace đích; giữ màu / ghim / lưu trữ.
    // Tự động gỡ assignee nếu người đó không phải thành viên workspace đích.
    @Override
    @Transactional
    public AreaResponse moveAreaToWorkspace(Long areaId, MoveAreaToWorkspaceRequest request) {
        Area area = findAreaOrThrow(areaId);

        Workspace target = workspaceRepository.findById(request.targetWorkspaceId())
                .orElseThrow(() -> new BusinessException(ErrorCode.WORKSPACE_NOT_FOUND));

        if (area.getWorkspace() != null && area.getWorkspace().getId().equals(target.getId())) {
            throw new BusinessException(ErrorCode.AREA_SAME_WORKSPACE);
        }

        double position = areaRepository.findMaxPositionByWorkspaceId(target.getId())
                .map(max -> max + POSITION_STEP)
                .orElse(POSITION_STEP);

        // Lấy danh sách ID thành viên của workspace đích
        List<Long> targetMemberIds = workspaceMemberRepository.findByWorkspace_Id(target.getId())
                .stream()
                .map(m -> m.getMember().getId())
                .toList();

        // Gỡ assignee nếu user không thuộc workspace đích để tránh lỗi phân quyền
        for (Card card : area.getCardList()) {
            if (card.getAssignee() != null && !targetMemberIds.contains(card.getAssignee().getId())) {
                card.setAssignee(null);
            }
        }

        area.setWorkspace(target);
        area.setPosition(position);
        area.setUpdatedAt(LocalDateTime.now());

        return AreaResponse.from(areaRepository.save(area));
    }

    // ----- hàm dùng chung -----

    private Area findAreaOrThrow(Long areaId) {
        return areaRepository.findById(areaId)
                .orElseThrow(() -> new BusinessException(ErrorCode.AREA_NOT_FOUND));
    }

    private void checkWorkspaceExists(Long workspaceId) {
        if (!workspaceRepository.existsById(workspaceId)) {
            throw new BusinessException(ErrorCode.WORKSPACE_NOT_FOUND);
        }
    }
}
