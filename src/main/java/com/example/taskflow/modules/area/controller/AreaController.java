package com.example.taskflow.modules.area.controller;

import com.example.taskflow.common.dto.ApiResponse;
import com.example.taskflow.modules.area.dto.AreaResponse;
import com.example.taskflow.modules.area.dto.CreateAreaRequest;
import com.example.taskflow.modules.area.dto.UpdateAreaRequest;
import com.example.taskflow.modules.area.service.AreaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/areas")
public class AreaController {

    private final AreaService areaService;

    public AreaController(AreaService areaService) {
        this.areaService = areaService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AreaResponse>>> getAreas(
            @RequestParam(required = false) Long workspaceId
    ) {
        List<AreaResponse> areas = areaService.getAreas(workspaceId);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(areas, "Get areas successfully"));
    }

    @GetMapping("/workspace/{workspaceId}")
    public ResponseEntity<ApiResponse<List<AreaResponse>>> getAreasByWorkspace(
            @PathVariable Long workspaceId
    ) {
        List<AreaResponse> areas = areaService.getAreas(workspaceId);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(areas, "Get areas by workspace successfully"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AreaResponse>> createArea(
            @Valid @RequestBody CreateAreaRequest request
    ) {
        AreaResponse createdArea = areaService.createArea(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(createdArea, "Create area successfully"));
    }

    @PutMapping("/{areaId}")
    public ResponseEntity<ApiResponse<AreaResponse>> updateArea(
            @PathVariable Long areaId,
            @Valid @RequestBody UpdateAreaRequest request
    ) {
        AreaResponse updatedArea = areaService.updateArea(areaId, request);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(updatedArea, "Update area successfully"));
    }

    @DeleteMapping("/{areaId}")
    public ResponseEntity<ApiResponse<Void>> deleteArea(@PathVariable Long areaId) {
        areaService.deleteArea(areaId);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(null, "Delete area successfully"));
    }
}
