package com.example.taskflow.modules.area.service;

import com.example.taskflow.common.enums.ErrorCode;
import com.example.taskflow.common.exception.BusinessException;
import com.example.taskflow.entity.Area;
import com.example.taskflow.entity.Card;
import com.example.taskflow.entity.CardMovement;
import com.example.taskflow.entity.Workspace;
import com.example.taskflow.modules.area.Repositories.AreaRepository;
import com.example.taskflow.modules.area.dto.AreaResponse;
import com.example.taskflow.modules.area.dto.CreateAreaRequest;
import com.example.taskflow.modules.area.dto.UpdateAreaRequest;
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

        return areas.stream()
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
        Area area = areaRepository.findById(areaId)
                .orElseThrow(() -> new BusinessException(ErrorCode.AREA_NOT_FOUND));

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

    @Override
    @Transactional
    public void deleteArea(Long areaId) {
        Area area = areaRepository.findById(areaId)
                .orElseThrow(() -> new BusinessException(ErrorCode.AREA_NOT_FOUND));

        List<Card> cards = cardRepository.findByArea_IdOrderByPositionAsc(areaId);
        for (Card card : cards) {
            List<CardMovement> cardMovements = cardMovementRepository.findByCard_IdOrderByMovedAtDesc(card.getId());
            if (!cardMovements.isEmpty()) {
                cardMovementRepository.deleteAll(cardMovements);
            }
        }
        if (!cards.isEmpty()) {
            cardRepository.deleteAll(cards);
        }

        if (area.getFromAreaList() != null && !area.getFromAreaList().isEmpty()) {
            cardMovementRepository.deleteAll(area.getFromAreaList());
        }
        if (area.getToAreaList() != null && !area.getToAreaList().isEmpty()) {
            cardMovementRepository.deleteAll(area.getToAreaList());
        }

        areaRepository.delete(area);
    }
}
