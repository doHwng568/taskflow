package com.example.taskflow.modules.workspace.controller;

import com.example.taskflow.common.dto.ApiResponse;
import com.example.taskflow.modules.workspace.dto.request.AddWorkspaceMemberRequest;
import com.example.taskflow.modules.workspace.dto.request.CreateWorkspaceRequest;
import com.example.taskflow.modules.workspace.dto.request.UpdateWorkspaceRequest;
import com.example.taskflow.modules.workspace.dto.response.WorkspaceMemberResponse;
import com.example.taskflow.modules.workspace.dto.response.WorkspaceResponse;
import com.example.taskflow.modules.workspace.service.WorkspaceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

        @PreAuthorize("hasAuthority('WORKSPACE_CREATE')")
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

        @PreAuthorize("hasAuthority('WORKSPACE_VIEW')")
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

        @PreAuthorize("hasAuthority('WORKSPACE_VIEW')")
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

        @PreAuthorize("hasAuthority('WORKSPACE_UPDATE')")
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

        @PreAuthorize("hasAuthority('WORKSPACE_DELETE')")
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

        @PreAuthorize("hasAuthority('WORKSPACE_VIEW')")
        @GetMapping("/{id}/members")
        public ResponseEntity<ApiResponse<List<WorkspaceMemberResponse>>> getWorkspaceMembers(
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

        @PreAuthorize("hasRole('PM')")
        @PostMapping("/{id}/members")
        public ResponseEntity<ApiResponse<WorkspaceMemberResponse>> addWorkspaceMember(
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

        @PreAuthorize("hasRole('PM')")
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
}