package com.example.taskflow.modules.area.service;

import com.example.taskflow.modules.area.dto.AreaResponse;
import com.example.taskflow.modules.area.dto.CreateAreaRequest;
import com.example.taskflow.modules.area.dto.UpdateAreaRequest;
import com.example.taskflow.modules.area.dto.request.CreateWorkspaceAreaRequest;
import com.example.taskflow.modules.area.dto.request.MoveAreaRequest;
import com.example.taskflow.modules.area.dto.request.RenameAreaRequest;
import com.example.taskflow.modules.area.dto.request.UpdateAreaColorRequest;

import java.util.List;

public interface AreaService {

    // ===== API chung /api/areas (nhánh develop) =====

    List<AreaResponse> getAreas(Long workspaceId);

    AreaResponse createArea(CreateAreaRequest request);

    AreaResponse updateArea(Long areaId, UpdateAreaRequest request);

    void deleteArea(Long areaId);

    // ===== API theo workspace (nhánh feature/area-*) =====

    // Area chưa lưu trữ của workspace, kèm thẻ con
    List<AreaResponse> getAreasByWorkspace(Long workspaceId);

    // Area đã lưu trữ của workspace (màn hình "Đã lưu trữ")
    List<AreaResponse> getArchivedAreasByWorkspace(Long workspaceId);

    AreaResponse createAreaInWorkspace(Long workspaceId, CreateWorkspaceAreaRequest request);

    AreaResponse renameArea(Long areaId, RenameAreaRequest request);

    AreaResponse archiveArea(Long areaId);

    AreaResponse restoreArea(Long areaId);

    AreaResponse updateAreaColor(Long areaId, UpdateAreaColorRequest request);

    AreaResponse moveArea(Long areaId, MoveAreaRequest request);
}
