package com.example.taskflow.modules.area.service;

import com.example.taskflow.common.enums.ErrorCode;
import com.example.taskflow.common.exception.BusinessException;
import com.example.taskflow.entity.Area;
import com.example.taskflow.entity.Workspace;
import com.example.taskflow.modules.area.Repositories.AreaRepository;
import com.example.taskflow.modules.area.dto.request.CreateAreaRequest;
import com.example.taskflow.modules.area.dto.request.MoveAreaRequest;
import com.example.taskflow.modules.area.dto.request.UpdateAreaColorRequest;
import com.example.taskflow.modules.area.dto.request.UpdateAreaRequest;
import com.example.taskflow.modules.area.dto.response.AreaResponse;
import com.example.taskflow.modules.card.Repositories.CardRepository;
import com.example.taskflow.modules.cardmovement.Repositories.CardMovementRepository;
import com.example.taskflow.modules.workspace.Repositories.WorkspaceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AreaService {

    // Khoảng cách giữa các area liền kề. Chừa chỗ trống để kéo thả chỉ cần
    // lấy trung bình hai position, không phải đánh số lại cả hàng.
    private static final double POSITION_STEP = 1000.0;

    // Nếu hai area liền kề gần nhau hơn mức này thì trung bình không còn chính xác
    // (số thực hết độ phân giải) -> phải đánh số lại cả workspace.
    private static final double MIN_POSITION_GAP = 1e-6;

    private final AreaRepository areaRepository;
    private final WorkspaceRepository workspaceRepository;
    private final CardRepository cardRepository;
    private final CardMovementRepository cardMovementRepository;

    public AreaService(AreaRepository areaRepository,
                       WorkspaceRepository workspaceRepository,
                       CardRepository cardRepository,
                       CardMovementRepository cardMovementRepository) {
        this.areaRepository = areaRepository;
        this.workspaceRepository = workspaceRepository;
        this.cardRepository = cardRepository;
        this.cardMovementRepository = cardMovementRepository;
    }

    // ===================== Tính năng 1: lấy danh sách =====================

    // Area chưa lưu trữ của workspace, kèm thẻ con
    @Transactional(readOnly = true)
    public List<AreaResponse> getAreasByWorkspace(Long workspaceId) {
        checkWorkspaceExists(workspaceId);

        return areaRepository.findActiveWithCards(workspaceId).stream()
                .map(AreaResponse::from)
                .toList();
    }

    // ===================== Tính năng 2: tạo =====================

    @Transactional
    public AreaResponse createArea(Long workspaceId, CreateAreaRequest request) {
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

    // ===================== Tính năng 3: đổi tên =====================

    @Transactional
    public AreaResponse updateArea(Long areaId, UpdateAreaRequest request) {
        Area area = findAreaOrThrow(areaId);

        area.setName(request.name().trim());
        area.setUpdatedAt(LocalDateTime.now());

        return AreaResponse.from(areaRepository.save(area));
    }

    // ===================== Tính năng 4: xóa =====================

    // Xóa hẳn area cùng toàn bộ thẻ trong area. Thứ tự bắt buộc vì có khóa ngoại.
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

    // ===================== Tính năng 5: lưu trữ / khôi phục =====================

    // Area đã lưu trữ của workspace, kèm thẻ con (cho màn hình "Đã lưu trữ")
    @Transactional(readOnly = true)
    public List<AreaResponse> getArchivedAreasByWorkspace(Long workspaceId) {
        checkWorkspaceExists(workspaceId);

        return areaRepository.findArchivedWithCards(workspaceId).stream()
                .map(AreaResponse::from)
                .toList();
    }

    @Transactional
    public AreaResponse archiveArea(Long areaId) {
        return setArchived(areaId, true);
    }

    // Khôi phục area về đúng vị trí cũ (position được giữ nguyên khi lưu trữ)
    @Transactional
    public AreaResponse restoreArea(Long areaId) {
        return setArchived(areaId, false);
    }

    private AreaResponse setArchived(Long areaId, boolean archived) {
        Area area = findAreaOrThrow(areaId);

        area.setArchived(archived);
        area.setUpdatedAt(LocalDateTime.now());

        return AreaResponse.from(areaRepository.save(area));
    }

    // ===================== Tính năng 6: đổi màu =====================

    // request.color() = null nghĩa là bỏ màu
    @Transactional
    public AreaResponse updateAreaColor(Long areaId, UpdateAreaColorRequest request) {
        Area area = findAreaOrThrow(areaId);

        area.setColor(request.color());
        area.setUpdatedAt(LocalDateTime.now());

        return AreaResponse.from(areaRepository.save(area));
    }

    // ===================== Tính năng 7: kéo thả đổi thứ tự =====================

    // Đặt area vào giữa previousArea và nextArea (null = đầu/cuối hàng).
    @Transactional
    public AreaResponse moveArea(Long areaId, MoveAreaRequest request) {
        Area area = findAreaOrThrow(areaId);
        Long workspaceId = area.getWorkspace().getId();

        Area previous = loadNeighbor(request.previousAreaId(), area, workspaceId);
        Area next = loadNeighbor(request.nextAreaId(), area, workspaceId);

        // Hai bên đã gửi lên phải đúng thứ tự trước -> sau, nếu không là dữ liệu cũ/sai
        if (previous != null && next != null && previous.getPosition() >= next.getPosition()) {
            throw new BusinessException(ErrorCode.AREA_INVALID_POSITION);
        }

        Double newPosition = calculatePosition(previous, next);

        if (newPosition == null) {
            // Hai area liền kề quá sát nhau: đánh số lại cả workspace rồi tính lại.
            // previous/next là cùng một đối tượng đang được quản lý trong transaction
            // nên tự nhận position mới sau khi đánh số lại.
            rebalance(workspaceId);
            newPosition = calculatePosition(previous, next);
        }

        area.setPosition(newPosition);
        area.setUpdatedAt(LocalDateTime.now());

        return AreaResponse.from(areaRepository.save(area));
    }

    // Trả về null nếu khoảng cách giữa hai bên quá nhỏ (cần đánh số lại)
    private Double calculatePosition(Area previous, Area next) {
        if (previous == null && next == null) {
            return POSITION_STEP;
        }
        if (previous == null) {
            return next.getPosition() - POSITION_STEP;      // lên đầu hàng
        }
        if (next == null) {
            return previous.getPosition() + POSITION_STEP;  // xuống cuối hàng
        }
        if (next.getPosition() - previous.getPosition() < MIN_POSITION_GAP) {
            return null;
        }
        return (previous.getPosition() + next.getPosition()) / 2;
    }

    // Đánh số lại toàn bộ area của workspace: 1000, 2000, 3000... theo thứ tự hiện tại
    private void rebalance(Long workspaceId) {
        List<Area> areas = areaRepository.findByWorkspace_IdOrderByPositionAsc(workspaceId);

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

        if (!neighbor.getWorkspace().getId().equals(workspaceId)) {
            throw new BusinessException(ErrorCode.AREA_INVALID_POSITION);
        }
        return neighbor;
    }

    // ===================== Hàm dùng chung =====================

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