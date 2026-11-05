package com.example.taskflow.modules.area.controller;

import com.example.taskflow.common.dto.ApiResponse;
import com.example.taskflow.modules.area.dto.request.CreateAreaRequest;
import com.example.taskflow.modules.area.dto.response.AreaResponse;
import com.example.taskflow.modules.area.service.AreaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/workspaces/{workspaceId}/areas")
public class AreaController {

    private final AreaService areaService;

    public AreaController(AreaService areaService) {
        this.areaService = areaService;
    }

    // GET /workspaces/{workspaceId}/areas
    @GetMapping
    public ResponseEntity<ApiResponse<List<AreaResponse>>> getAreas(@PathVariable Long workspaceId) {
        List<AreaResponse> areas = areaService.getAreasByWorkspace(workspaceId);

        return ResponseEntity.ok(ApiResponse.success(areas, "Get areas successfully"));
    }

    // POST /workspaces/{workspaceId}/areas   body: { "name": "Tên area" }
    @PostMapping
    public ResponseEntity<ApiResponse<AreaResponse>> createArea(
            @PathVariable Long workspaceId,
            @Valid @RequestBody CreateAreaRequest request) {
        AreaResponse area = areaService.createArea(workspaceId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(area, "Create area successfully"));
    }
}