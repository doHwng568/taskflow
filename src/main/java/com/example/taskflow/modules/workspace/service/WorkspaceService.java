package com.example.taskflow.modules.workspace.service;

import com.example.taskflow.modules.workspace.dto.request.AddWorkspaceMemberRequest;
import com.example.taskflow.modules.workspace.dto.request.CreateWorkspaceRequest;
import com.example.taskflow.modules.workspace.dto.request.TransferWorkspaceOwnershipRequest;
import com.example.taskflow.modules.workspace.dto.request.UpdateWorkspaceMemberRoleRequest;
import com.example.taskflow.modules.workspace.dto.request.UpdateWorkspaceRequest;
import com.example.taskflow.modules.workspace.dto.response.WorkspaceMemberResponse;
import com.example.taskflow.modules.workspace.dto.response.WorkspaceResponse;

import java.util.List;

public interface WorkspaceService {

    // Workspace CRUD
    WorkspaceResponse createWorkspace(
            CreateWorkspaceRequest request,
            String username
    );

    List<WorkspaceResponse> getMyWorkspaces(String username);

    WorkspaceResponse getWorkspaceById(
            Long workspaceId,
            String username
    );

    WorkspaceResponse updateWorkspace(
            Long workspaceId,
            UpdateWorkspaceRequest request,
            String username
    );

    void deleteWorkspace(
            Long workspaceId,
            String username
    );

    // Workspace Member Management
    List<WorkspaceMemberResponse> getWorkspaceMembers(
            Long workspaceId,
            String username
    );

    WorkspaceMemberResponse addWorkspaceMember(
            Long workspaceId,
            AddWorkspaceMemberRequest request,
            String username
    );

    WorkspaceMemberResponse updateMemberRole(
            Long workspaceId,
            Long userId,
            UpdateWorkspaceMemberRoleRequest request,
            String username
    );

    void removeWorkspaceMember(
            Long workspaceId,
            Long userId,
            String username
    );

    WorkspaceResponse transferOwnership(
            Long workspaceId,
            TransferWorkspaceOwnershipRequest request,
            String username
    );
}