package com.example.taskflow.modules.area.service;

import com.example.taskflow.modules.area.dto.AreaResponse;
import com.example.taskflow.modules.area.dto.CreateAreaRequest;
import com.example.taskflow.modules.area.dto.UpdateAreaRequest;

import java.util.List;

public interface AreaService {

    List<AreaResponse> getAreas(Long workspaceId);

    AreaResponse createArea(CreateAreaRequest request);

    AreaResponse updateArea(Long areaId, UpdateAreaRequest request);

    void deleteArea(Long areaId);
}
