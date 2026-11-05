package com.example.taskflow.modules.area.service;

import com.example.taskflow.common.enums.ErrorCode;
import com.example.taskflow.common.exception.BusinessException;
import com.example.taskflow.modules.area.Repositories.AreaRepository;
import com.example.taskflow.modules.area.dto.response.AreaResponse;
import com.example.taskflow.modules.workspace.Repositories.WorkspaceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AreaService {

    private final AreaRepository areaRepository;
    private final WorkspaceRepository workspaceRepository;

    public AreaService(AreaRepository areaRepository, WorkspaceRepository workspaceRepository) {
        this.areaRepository = areaRepository;
        this.workspaceRepository = workspaceRepository;
    }

    @Transactional(readOnly = true)
    public List<AreaResponse> getAreasByWorkspace(Long workspaceId) {
        if (!workspaceRepository.existsById(workspaceId)) {
            throw new BusinessException(ErrorCode.WORKSPACE_NOT_FOUND);
        }

        return areaRepository.findActiveWithCards(workspaceId).stream()
                .map(AreaResponse::from)
                .toList();
    }
}