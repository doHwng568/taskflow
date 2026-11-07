package com.example.taskflow.modules.area.controller;

import com.example.taskflow.common.dto.ApiResponse;
import com.example.taskflow.modules.area.dto.request.CreateAreaRequest;
import com.example.taskflow.modules.area.dto.request.UpdateAreaRequest;
import com.example.taskflow.modules.area.dto.response.AreaResponse;
import com.example.taskflow.modules.area.service.AreaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Không đặt @RequestMapping ở cấp class vì có hai nhóm đường dẫn:
//  - /workspaces/{workspaceId}/areas : thao tác theo workspace (lấy danh sách, tạo)
//  - /areas/{areaId}                 : thao tác trên một area cụ thể (sửa, xóa...)
@RestController
public class AreaController {

    private final AreaService areaService;

    public AreaController(AreaService areaService) {
        this.areaService = areaService;
    }

    // GET /workspaces/{workspaceId}/areas
    @GetMapping("/workspaces/{workspaceId}/areas")
    public ResponseEntity<ApiResponse<List<AreaResponse>>> getAreas(@PathVariable Long workspaceId) {
        List<AreaResponse> areas = areaService.getAreasByWorkspace(workspaceId);

        return ResponseEntity.ok(ApiResponse.success(areas, "Get areas successfully"));
    }

    // POST /workspaces/{workspaceId}/areas   body: { "name": "Tên area" }
    @PostMapping("/workspaces/{workspaceId}/areas")
    public ResponseEntity<ApiResponse<AreaResponse>> createArea(
            @PathVariable Long workspaceId,
            @Valid @RequestBody CreateAreaRequest request) {
        AreaResponse area = areaService.createArea(workspaceId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(area, "Create area successfully"));
    }

    // PATCH /areas/{areaId}   body: { "name": "Tên mới" }
    @PatchMapping("/areas/{areaId}")
    public ResponseEntity<ApiResponse<AreaResponse>> updateArea(
            @PathVariable Long areaId,
            @Valid @RequestBody UpdateAreaRequest request) {
        AreaResponse area = areaService.updateArea(areaId, request);

        return ResponseEntity.ok(ApiResponse.success(area, "Update area successfully"));
    }

    // DELETE /areas/{areaId}  -> 204 No Content
    @DeleteMapping("/areas/{areaId}")
    public ResponseEntity<Void> deleteArea(@PathVariable Long areaId) {
        areaService.deleteArea(areaId);

        return ResponseEntity.noContent().build();
    }
}