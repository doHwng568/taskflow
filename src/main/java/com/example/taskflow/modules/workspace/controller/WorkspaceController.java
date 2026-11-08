
package com.example.taskflow.modules.workspace.controller;

import com.example.taskflow.common.dto.ApiResponse;
import com.example.taskflow.modules.workspace.dto.request.AddWorkspaceMemberRequest;
import com.example.taskflow.modules.workspace.dto.request.CreateWorkspaceRequest;
import com.example.taskflow.modules.workspace.dto.request.TransferWorkspaceOwnershipRequest;
import com.example.taskflow.modules.workspace.dto.request.UpdateWorkspaceMemberRoleRequest;
import com.example.taskflow.modules.workspace.dto.request.UpdateWorkspaceRequest;
import com.example.taskflow.modules.workspace.dto.response.WorkspaceMemberResponse;
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

    // ==============================
    // WORKSPACE CRUD
    // ==============================

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

    // 2. Get My Workspaces
    @GetMapping
    public ResponseEntity<ApiResponse<List<WorkspaceResponse>>> getMyWorkspaces(
            Authentication authentication
    ) {
        List<WorkspaceResponse> response =
                workspaceService.getMyWorkspaces(
                        authentication != null ? authentication.getName() : null
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        response,
                        "Workspaces retrieved successfully"
                )
        );
    }

    // 3. Get Workspace Detail
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

    // 4. Update Workspace
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

    // 5. Delete Workspace
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

    // ==============================
    // WORKSPACE MEMBER MANAGEMENT
    // ==============================

    // 6. Get Workspace Members
    @GetMapping("/{id}/members")
    public ResponseEntity<ApiResponse<List<WorkspaceMemberResponse>>>
    getWorkspaceMembers(
            @PathVariable Long id,
            Authentication authentication
    ) {
        List<WorkspaceMemberResponse> response =
                workspaceService.getWorkspaceMembers(
                        id,
                        authentication.getName()
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        response,
                        "Workspace members retrieved successfully"
                )
        );
    }

    // 7. Add Workspace Member
    @PostMapping("/{id}/members")
    public ResponseEntity<ApiResponse<WorkspaceMemberResponse>>
    addWorkspaceMember(
            @PathVariable Long id,
            @Valid @RequestBody AddWorkspaceMemberRequest request,
            Authentication authentication
    ) {
        WorkspaceMemberResponse response =
                workspaceService.addWorkspaceMember(
                        id,
                        request,
                        authentication.getName()
                );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        response,
                        "Workspace member added successfully"
                ));
    }

    // 8. Update Member Role
    @PutMapping("/{id}/members/{userId}/role")
    public ResponseEntity<ApiResponse<WorkspaceMemberResponse>>
    updateMemberRole(
            @PathVariable Long id,
            @PathVariable Long userId,
            @Valid @RequestBody UpdateWorkspaceMemberRoleRequest request,
            Authentication authentication
    ) {
        WorkspaceMemberResponse response =
                workspaceService.updateMemberRole(
                        id,
                        userId,
                        request,
                        authentication.getName()
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        response,
                        "Workspace member role updated successfully"
                )
        );
    }

    // 9. Remove Workspace Member
    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeWorkspaceMember(
            @PathVariable Long id,
            @PathVariable Long userId,
            Authentication authentication
    ) {
        workspaceService.removeWorkspaceMember(
                id,
                userId,
                authentication.getName()
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        null,
                        "Workspace member removed successfully"
                )
        );
    }

    // 10. Transfer Workspace Ownership
    @PostMapping("/{id}/transfer-ownership")
    public ResponseEntity<ApiResponse<WorkspaceResponse>>
    transferOwnership(
            @PathVariable Long id,
            @Valid @RequestBody TransferWorkspaceOwnershipRequest request,
            Authentication authentication
    ) {
        WorkspaceResponse response =
                workspaceService.transferOwnership(
                        id,
                        request,
                        authentication.getName()
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        response,
                        "Workspace ownership transferred successfully"
                )
        );
    }
}
