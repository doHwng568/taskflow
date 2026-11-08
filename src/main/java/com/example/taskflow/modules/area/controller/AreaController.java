package com.example.taskflow.modules.area.controller;

import com.example.taskflow.common.dto.ApiResponse;
import com.example.taskflow.modules.area.dto.request.CreateAreaRequest;
import com.example.taskflow.modules.area.dto.request.MoveAreaRequest;
import com.example.taskflow.modules.area.dto.request.UpdateAreaColorRequest;
import com.example.taskflow.modules.area.dto.request.UpdateAreaRequest;
import com.example.taskflow.modules.area.dto.response.AreaResponse;
import com.example.taskflow.modules.area.service.AreaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Hai nhóm đường dẫn:
//  - /workspaces/{workspaceId}/areas... : thao tác theo workspace
//  - /areas/{areaId}...                 : thao tác trên một area cụ thể
@RestController
public class AreaController {

    private final AreaService areaService;

    public AreaController(AreaService areaService) {
        this.areaService = areaService;
    }

    // GET /workspaces/{workspaceId}/areas
    @GetMapping("/workspaces/{workspaceId}/areas")
    public ResponseEntity<ApiResponse<List<AreaResponse>>> getAreas(@PathVariable Long workspaceId) {
        return ResponseEntity.ok(ApiResponse.success(
                areaService.getAreasByWorkspace(workspaceId), "Get areas successfully"));
    }

    // GET /workspaces/{workspaceId}/areas/archived
    @GetMapping("/workspaces/{workspaceId}/areas/archived")
    public ResponseEntity<ApiResponse<List<AreaResponse>>> getArchivedAreas(@PathVariable Long workspaceId) {
        return ResponseEntity.ok(ApiResponse.success(
                areaService.getArchivedAreasByWorkspace(workspaceId), "Get archived areas successfully"));
    }

    // POST /workspaces/{workspaceId}/areas   body: { "name": "Tên area" }
    @PostMapping("/workspaces/{workspaceId}/areas")
    public ResponseEntity<ApiResponse<AreaResponse>> createArea(
            @PathVariable Long workspaceId,
            @Valid @RequestBody CreateAreaRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(areaService.createArea(workspaceId, request), "Create area successfully"));
    }

    // PATCH /areas/{areaId}   body: { "name": "Tên mới" }
    @PatchMapping("/areas/{areaId}")
    public ResponseEntity<ApiResponse<AreaResponse>> updateArea(
            @PathVariable Long areaId,
            @Valid @RequestBody UpdateAreaRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                areaService.updateArea(areaId, request), "Update area successfully"));
    }

    // DELETE /areas/{areaId}  -> 204 No Content
    @DeleteMapping("/areas/{areaId}")
    public ResponseEntity<Void> deleteArea(@PathVariable Long areaId) {
        areaService.deleteArea(areaId);

        return ResponseEntity.noContent().build();
    }

    // PATCH /areas/{areaId}/archive
    @PatchMapping("/areas/{areaId}/archive")
    public ResponseEntity<ApiResponse<AreaResponse>> archiveArea(@PathVariable Long areaId) {
        return ResponseEntity.ok(ApiResponse.success(
                areaService.archiveArea(areaId), "Archive area successfully"));
    }

    // PATCH /areas/{areaId}/restore
    @PatchMapping("/areas/{areaId}/restore")
    public ResponseEntity<ApiResponse<AreaResponse>> restoreArea(@PathVariable Long areaId) {
        return ResponseEntity.ok(ApiResponse.success(
                areaService.restoreArea(areaId), "Restore area successfully"));
    }

    // PATCH /areas/{areaId}/color   body: { "color": "#1E40AF" } hoặc { "color": null } để bỏ màu
    @PatchMapping("/areas/{areaId}/color")
    public ResponseEntity<ApiResponse<AreaResponse>> updateAreaColor(
            @PathVariable Long areaId,
            @Valid @RequestBody UpdateAreaColorRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                areaService.updateAreaColor(areaId, request), "Update area color successfully"));
    }

    // PATCH /areas/{areaId}/position   body: { "previousAreaId": 1, "nextAreaId": 3 }
    @PatchMapping("/areas/{areaId}/position")
    public ResponseEntity<ApiResponse<AreaResponse>> moveArea(
            @PathVariable Long areaId,
            @RequestBody MoveAreaRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                areaService.moveArea(areaId, request), "Move area successfully"));
    }
}