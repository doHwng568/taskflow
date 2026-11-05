package com.example.taskflow.modules.area.controller;

import com.example.taskflow.common.dto.ApiResponse;
import com.example.taskflow.modules.area.dto.response.AreaResponse;
import com.example.taskflow.modules.area.service.AreaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/workspaces/{workspaceId}/areas")
public class AreaController {

    private final AreaService areaService;

    public AreaController(AreaService areaService) {
        this.areaService = areaService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AreaResponse>>> getAreas(@PathVariable Long workspaceId) {
        List<AreaResponse> areas = areaService.getAreasByWorkspace(workspaceId);

        return ResponseEntity.ok(ApiResponse.success(areas, "Get areas successfully"));
    }
}