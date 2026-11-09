package com.example.taskflow.modules.area.controller;

import com.example.taskflow.common.dto.ApiResponse;
import com.example.taskflow.modules.area.dto.AreaResponse;
import com.example.taskflow.modules.area.dto.CreateAreaRequest;
import com.example.taskflow.modules.area.dto.UpdateAreaRequest;
import com.example.taskflow.modules.area.dto.request.CopyAreaRequest;
import com.example.taskflow.modules.area.dto.request.CreateWorkspaceAreaRequest;
import com.example.taskflow.modules.area.dto.request.MoveAreaRequest;
import com.example.taskflow.modules.area.dto.request.MoveAreaToWorkspaceRequest;
import com.example.taskflow.modules.area.dto.request.PinAreaRequest;
import com.example.taskflow.modules.area.dto.request.RenameAreaRequest;
import com.example.taskflow.modules.area.dto.request.UpdateAreaColorRequest;
import com.example.taskflow.modules.area.service.AreaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Hai nhóm đường dẫn cùng tồn tại:
//  1) /api/areas...                       : API chung (nhánh develop, dùng bởi cardApi.js)
//  2) /workspaces/{workspaceId}/areas...  : thao tác theo workspace  } nhánh feature/area-*
//     /areas/{areaId}...                  : thao tác trên một area   } (dùng bởi areaService.js)
@RestController
public class AreaController {

    private final AreaService areaService;

    public AreaController(AreaService areaService) {
        this.areaService = areaService;
    }

    // =====================================================================
    // 1) /api/areas  (develop)
    // =====================================================================

    @GetMapping("/api/areas")
    public ResponseEntity<ApiResponse<List<AreaResponse>>> getAreas(
            @RequestParam(required = false) Long workspaceId
    ) {
        List<AreaResponse> areas = areaService.getAreas(workspaceId);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(areas, "Get areas successfully"));
    }

    @GetMapping("/api/areas/workspace/{workspaceId}")
    public ResponseEntity<ApiResponse<List<AreaResponse>>> getAreasByWorkspaceLegacy(
            @PathVariable Long workspaceId
    ) {
        List<AreaResponse> areas = areaService.getAreas(workspaceId);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(areas, "Get areas by workspace successfully"));
    }

    @PostMapping("/api/areas")
    public ResponseEntity<ApiResponse<AreaResponse>> createArea(
            @Valid @RequestBody CreateAreaRequest request
    ) {
        AreaResponse createdArea = areaService.createArea(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(createdArea, "Create area successfully"));
    }

    @PutMapping("/api/areas/{areaId}")
    public ResponseEntity<ApiResponse<AreaResponse>> updateAreaLegacy(
            @PathVariable Long areaId,
            @Valid @RequestBody UpdateAreaRequest request
    ) {
        AreaResponse updatedArea = areaService.updateArea(areaId, request);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(updatedArea, "Update area successfully"));
    }

    @DeleteMapping("/api/areas/{areaId}")
    public ResponseEntity<ApiResponse<Void>> deleteAreaLegacy(@PathVariable Long areaId) {
        areaService.deleteArea(areaId);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(null, "Delete area successfully"));
    }

    // =====================================================================
    // 2) /workspaces/{workspaceId}/areas và /areas/{areaId}  (feature)
    // =====================================================================

    // GET /workspaces/{workspaceId}/areas
    @GetMapping("/workspaces/{workspaceId}/areas")
    public ResponseEntity<ApiResponse<List<AreaResponse>>> getAreasByWorkspace(@PathVariable Long workspaceId) {
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
    public ResponseEntity<ApiResponse<AreaResponse>> createAreaInWorkspace(
            @PathVariable Long workspaceId,
            @Valid @RequestBody CreateWorkspaceAreaRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        areaService.createAreaInWorkspace(workspaceId, request), "Create area successfully"));
    }

    // PATCH /areas/{areaId}   body: { "name": "Tên mới" }
    @PatchMapping("/areas/{areaId}")
    public ResponseEntity<ApiResponse<AreaResponse>> renameArea(
            @PathVariable Long areaId,
            @Valid @RequestBody RenameAreaRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                areaService.renameArea(areaId, request), "Update area successfully"));
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

    // PATCH /areas/{areaId}/pin   body: { "pinned": true }
    @PatchMapping("/areas/{areaId}/pin")
    public ResponseEntity<ApiResponse<AreaResponse>> pinArea(
            @PathVariable Long areaId,
            @Valid @RequestBody PinAreaRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                areaService.pinArea(areaId, request), "Pin area successfully"));
    }

    // POST /areas/{areaId}/copy  -> 201, bản sao kèm thẻ (tùy chọn đặt tên mới qua body)
    @PostMapping("/areas/{areaId}/copy")
    public ResponseEntity<ApiResponse<AreaResponse>> copyArea(
            @PathVariable Long areaId,
            @Valid @RequestBody(required = false) CopyAreaRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(areaService.copyArea(areaId, request), "Copy area successfully"));
    }

    // PATCH /areas/{areaId}/workspace   body: { "targetWorkspaceId": 5 }
    @PatchMapping("/areas/{areaId}/workspace")
    public ResponseEntity<ApiResponse<AreaResponse>> moveAreaToWorkspace(
            @PathVariable Long areaId,
            @Valid @RequestBody MoveAreaToWorkspaceRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                areaService.moveAreaToWorkspace(areaId, request), "Move area to workspace successfully"));
    }
}
