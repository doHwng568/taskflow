
package com.example.taskflow.modules.workspace.controller;

import com.example.taskflow.common.dto.ApiResponse;
import com.example.taskflow.modules.workspace.dto.request.CreateWorkspaceRequest;
import com.example.taskflow.modules.workspace.dto.request.UpdateWorkspaceRequest;
import com.example.taskflow.modules.workspace.dto.response.WorkspaceResponse;
import com.example.taskflow.modules.workspace.service.WorkspaceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workspaces")
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    public WorkspaceController(WorkspaceService workspaceService) {
        this.workspaceService = workspaceService;
    }

    // 1. Create Workspace
    @PostMapping
    public ResponseEntity<ApiResponse<WorkspaceResponse>> createWorkspace(
            @Valid @RequestBody CreateWorkspaceRequest request,
            Authentication authentication
    ) {
        WorkspaceResponse response =
                workspaceService.createWorkspace(
                        request,
                        authentication.getName()
                );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        response,
                        "Workspace created successfully"
                ));
    }

    // 2. Get all workspaces of current user
    @GetMapping
    public ResponseEntity<ApiResponse<List<WorkspaceResponse>>> getMyWorkspaces(
            Authentication authentication
    ) {
        List<WorkspaceResponse> response =
                workspaceService.getMyWorkspaces(
                        authentication.getName()
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        response,
                        "Workspaces retrieved successfully"
                )
        );
    }

    // 3. Get workspace detail
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkspaceResponse>> getWorkspaceById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        WorkspaceResponse response =
                workspaceService.getWorkspaceById(
                        id,
                        authentication.getName()
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        response,
                        "Workspace retrieved successfully"
                )
        );
    }

    // 4. Update workspace
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkspaceResponse>> updateWorkspace(
            @PathVariable Long id,
            @Valid @RequestBody UpdateWorkspaceRequest request,
            Authentication authentication
    ) {
        WorkspaceResponse response =
                workspaceService.updateWorkspace(
                        id,
                        request,
                        authentication.getName()
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        response,
                        "Workspace updated successfully"
                )
        );
    }

    // 5. Delete workspace
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteWorkspace(
            @PathVariable Long id,
            Authentication authentication
    ) {
        workspaceService.deleteWorkspace(
                id,
                authentication.getName()
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        null,
                        "Workspace deleted successfully"
                )
        );
    }
}
