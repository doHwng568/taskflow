
package com.example.taskflow.modules.workspace.service;

import com.example.taskflow.common.enums.ErrorCode;
import com.example.taskflow.common.enums.WorkspaceRole;
import com.example.taskflow.common.exception.BusinessException;
import com.example.taskflow.entity.User;
import com.example.taskflow.entity.Workspace;
import com.example.taskflow.entity.WorkspaceMember;
import com.example.taskflow.modules.workspace.Repositories.WorkspaceMemberRepository;
import com.example.taskflow.modules.workspace.Repositories.WorkspaceRepository;
import com.example.taskflow.modules.workspace.dto.request.CreateWorkspaceRequest;
import com.example.taskflow.modules.workspace.dto.request.UpdateWorkspaceRequest;
import com.example.taskflow.modules.workspace.dto.response.WorkspaceResponse;
import com.example.taskflow.user.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class WorkspaceServiceImpl implements WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final UserRepository userRepository;

    public WorkspaceServiceImpl(
            WorkspaceRepository workspaceRepository,
            WorkspaceMemberRepository workspaceMemberRepository,
            UserRepository userRepository
    ) {
        this.workspaceRepository = workspaceRepository;
        this.workspaceMemberRepository = workspaceMemberRepository;
        this.userRepository = userRepository;
    }

    // Find current user
    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    // Find workspace
    private Workspace getWorkspace(Long workspaceId) {
        return workspaceRepository.findById(workspaceId)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.WORKSPACE_NOT_FOUND));
    }

    // Check membership
    private WorkspaceMember getMembership(
            Long workspaceId,
            User user
    ) {
        return workspaceMemberRepository
                .findByWorkspace_IdAndMember_Id(
                        workspaceId,
                        user.getId()
                )
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.ACCESS_DENIED));
    }

    // Check OWNER or ADMIN
    private void checkAdminPermission(WorkspaceMember membership) {
        WorkspaceRole role = membership.getRole();

        if (role != WorkspaceRole.OWNER
                && role != WorkspaceRole.ADMIN) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }
    }

    // Convert Entity to DTO
    private WorkspaceResponse toResponse(
            Workspace workspace,
            WorkspaceRole currentRole
    ) {
        int memberCount = workspaceMemberRepository
                .findByWorkspace_Id(workspace.getId())
                .size();

        return WorkspaceResponse.builder()
                .id(workspace.getId())
                .name(workspace.getName())
                .description(workspace.getDescription())
                .ownerUsername(workspace.getOwner().getUsername())
                .currentUserRole(currentRole)
                .memberCount(memberCount)
                .createdAt(workspace.getCreatedAt())
                .updatedAt(workspace.getUpdatedAt())
                .build();
    }

    // CREATE WORKSPACE
    @Override
    public WorkspaceResponse createWorkspace(
            CreateWorkspaceRequest request,
            String username
    ) {
        User user = getUser(username);

        LocalDateTime now = LocalDateTime.now();

        Workspace workspace = new Workspace();
        workspace.setName(request.getName().trim());
        workspace.setDescription(request.getDescription());
        workspace.setOwner(user);
        workspace.setCreatedAt(now);
        workspace.setUpdatedAt(now);

        Workspace savedWorkspace =
                workspaceRepository.save(workspace);

        // Automatically assign OWNER role
        WorkspaceMember membership = new WorkspaceMember();
        membership.setWorkspace(savedWorkspace);
        membership.setMember(user);
        membership.setRole(WorkspaceRole.OWNER);
        membership.setJoinedAt(now);

        workspaceMemberRepository.save(membership);

        return toResponse(savedWorkspace, WorkspaceRole.OWNER);
    }

    // GET MY WORKSPACES
    @Override
    public List<WorkspaceResponse> getMyWorkspaces(String username) {
        User user = getUser(username);

        List<WorkspaceMember> memberships =
                workspaceMemberRepository.findByMember_Id(user.getId());

        return memberships.stream()
                .map(membership ->
                        toResponse(
                                membership.getWorkspace(),
                                membership.getRole()
                        )
                )
                .toList();
    }

    // GET WORKSPACE DETAIL
    @Override
    public WorkspaceResponse getWorkspaceById(
            Long workspaceId,
            String username
    ) {
        User user = getUser(username);

        Workspace workspace = getWorkspace(workspaceId);

        WorkspaceMember membership =
                getMembership(workspaceId, user);

        return toResponse(workspace, membership.getRole());
    }

    // UPDATE WORKSPACE
    @Override
    public WorkspaceResponse updateWorkspace(
            Long workspaceId,
            UpdateWorkspaceRequest request,
            String username
    ) {
        User user = getUser(username);

        Workspace workspace = getWorkspace(workspaceId);

        WorkspaceMember membership =
                getMembership(workspaceId, user);

        checkAdminPermission(membership);

        workspace.setName(request.getName().trim());
        workspace.setDescription(request.getDescription());
        workspace.setUpdatedAt(LocalDateTime.now());

        Workspace updatedWorkspace =
                workspaceRepository.save(workspace);

        return toResponse(
                updatedWorkspace,
                membership.getRole()
        );
    }

    // DELETE WORKSPACE
    @Override
    public void deleteWorkspace(
            Long workspaceId,
            String username
    ) {
        User user = getUser(username);

        Workspace workspace = getWorkspace(workspaceId);

        WorkspaceMember membership =
                getMembership(workspaceId, user);

        // Only OWNER can delete
        if (membership.getRole() != WorkspaceRole.OWNER) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }

        // Do not delete workspace containing areas
        if (!workspace.getAreaList().isEmpty()) {
            throw new BusinessException(ErrorCode.WORKSPACE_HAS_AREAS);
        }

        workspaceMemberRepository
                .deleteAllByWorkspace_Id(workspaceId);

        workspaceRepository.delete(workspace);
    }
}

