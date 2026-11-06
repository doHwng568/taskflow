
package com.example.taskflow.modules.workspace.service;

import com.example.taskflow.modules.workspace.dto.request.CreateWorkspaceRequest;
import com.example.taskflow.modules.workspace.dto.request.UpdateWorkspaceRequest;
import com.example.taskflow.modules.workspace.dto.response.WorkspaceResponse;

import java.util.List;

public interface WorkspaceService {

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
}

