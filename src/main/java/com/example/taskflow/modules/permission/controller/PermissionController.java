package com.example.taskflow.modules.permission.controller;

import com.example.taskflow.common.dto.ApiResponse;
import com.example.taskflow.modules.permission.dto.request.UpdatePermissionMatrixRequest;
import com.example.taskflow.modules.permission.dto.response.PermissionMatrixResponse;
import com.example.taskflow.modules.permission.service.PermissionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/permissions")
public class PermissionController {

    private final PermissionService permissionService;

    public PermissionController(PermissionService permissionService) {
        this.permissionService = permissionService;
    }

    // get matrix permission
    @PreAuthorize("hasRole('PM')")
    @GetMapping("/matrix")
    public ResponseEntity<ApiResponse<PermissionMatrixResponse>> getMatrix() {
        PermissionMatrixResponse response = permissionService.getMatrix();
        return ResponseEntity.ok(ApiResponse.success(response, "Get permission matrix successfully"));
    }

    // update matrix permission
    @PreAuthorize("hasRole('PM')")
    @PutMapping("/matrix")
    public ResponseEntity<ApiResponse<Void>> updateMatrix(
            @Valid @RequestBody UpdatePermissionMatrixRequest request) {
        permissionService.updateMatrix(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Update permission matrix successfully"));
    }
}
