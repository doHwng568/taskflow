package com.example.taskflow.modules.area.service;

import com.example.taskflow.common.enums.ErrorCode;
import com.example.taskflow.common.exception.BusinessException;
import com.example.taskflow.entity.Area;
import com.example.taskflow.entity.Workspace;
import com.example.taskflow.modules.area.Repositories.AreaRepository;
import com.example.taskflow.modules.area.dto.request.CreateAreaRequest;
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

    // Khoảng cách giữa các area liền kề. Chừa chỗ trống để sau này kéo thả
    // chỉ cần lấy trung bình hai position, không phải đánh số lại cả hàng.
    private static final double POSITION_STEP = 1000.0;

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

    // Lấy danh sách area (chưa lưu trữ) của workspace, kèm thẻ con
    @Transactional(readOnly = true)
    public List<AreaResponse> getAreasByWorkspace(Long workspaceId) {
        if (!workspaceRepository.existsById(workspaceId)) {
            throw new BusinessException(ErrorCode.WORKSPACE_NOT_FOUND);
        }

        return areaRepository.findActiveWithCards(workspaceId).stream()
                .map(AreaResponse::from)
                .toList();
    }

    // Tạo area mới ở cuối workspace
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

    // Đổi tên area
    @Transactional
    public AreaResponse updateArea(Long areaId, UpdateAreaRequest request) {
        Area area = areaRepository.findById(areaId)
                .orElseThrow(() -> new BusinessException(ErrorCode.AREA_NOT_FOUND));

        area.setName(request.name().trim());
        area.setUpdatedAt(LocalDateTime.now());

        return AreaResponse.from(areaRepository.save(area));
    }

    // Xóa hẳn area cùng toàn bộ thẻ trong area. Thứ tự bắt buộc vì có khóa ngoại:
    // lịch sử của thẻ -> tham chiếu area trong lịch sử khác -> thẻ -> area.
    // Cả chuỗi nằm trong một transaction: lỗi ở bước nào thì hoàn tác toàn bộ.
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
}