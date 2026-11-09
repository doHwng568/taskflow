package com.example.taskflow.modules.workspace.service;

import com.example.taskflow.common.enums.ErrorCode;
import com.example.taskflow.common.enums.Role;
import com.example.taskflow.common.exception.BusinessException;
import com.example.taskflow.entity.User;
import com.example.taskflow.entity.Workspace;
import com.example.taskflow.entity.WorkspaceMember;
import com.example.taskflow.modules.workspace.Repositories.WorkspaceMemberRepository;
import com.example.taskflow.modules.workspace.Repositories.WorkspaceRepository;
import com.example.taskflow.modules.workspace.dto.request.AddWorkspaceMemberRequest;
import com.example.taskflow.modules.workspace.dto.request.CreateWorkspaceRequest;
import com.example.taskflow.modules.workspace.dto.request.UpdateWorkspaceRequest;
import com.example.taskflow.modules.workspace.dto.response.WorkspaceMemberResponse;
import com.example.taskflow.modules.workspace.dto.response.WorkspaceResponse;
import com.example.taskflow.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    // =====================================
    // COMMON METHODS
    // =====================================

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    private Workspace getWorkspace(Long workspaceId) {
        return workspaceRepository.findById(workspaceId)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.WORKSPACE_NOT_FOUND));
    }

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

    private void checkPm(User user) {
        if (user.getRole() != Role.PM) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }
    }

    private WorkspaceResponse toResponse(
            Workspace workspace,
            User currentUser
    ) {
        int memberCount = Math.toIntExact(
                workspaceMemberRepository.countByWorkspace_Id(
                        workspace.getId()
                )
        );

        return WorkspaceResponse.builder()
                .id(workspace.getId())
                .name(workspace.getName())
                .description(workspace.getDescription())
                .ownerUsername(
                        workspace.getOwner() != null
                                ? workspace.getOwner().getUsername()
                                : null
                )
                .currentUserRole(currentUser.getRole())
                .memberCount(memberCount)
                .createdAt(workspace.getCreatedAt())
                .updatedAt(workspace.getUpdatedAt())
                .build();
    }

    private WorkspaceMemberResponse toMemberResponse(
            WorkspaceMember membership
    ) {
        User member = membership.getMember();

        return WorkspaceMemberResponse.builder()
                .id(membership.getId())
                .userId(member.getId())
                .username(member.getUsername())
                .fullName(member.getFullName())
                .email(member.getEmail())
                .userRole(member.getRole())
                .joinedAt(membership.getJoinedAt())
                .build();
    }

    // =====================================
    // CREATE WORKSPACE
    // =====================================

    @Override
    public WorkspaceResponse createWorkspace(
            CreateWorkspaceRequest request,
            String username
    ) {
        User user = getUser(username);
        checkPm(user);

        LocalDateTime now = LocalDateTime.now();

        Workspace workspace = new Workspace();
        workspace.setName(request.getName().trim());
        workspace.setDescription(request.getDescription());
        workspace.setOwner(user);
        workspace.setCreatedAt(now);
        workspace.setUpdatedAt(now);

        Workspace savedWorkspace =
                workspaceRepository.save(workspace);

        WorkspaceMember membership = new WorkspaceMember();
        membership.setWorkspace(savedWorkspace);
        membership.setMember(user);
        membership.setJoinedAt(now);

        workspaceMemberRepository.save(membership);

        return toResponse(savedWorkspace, user);
    }

    // =====================================
    // GET MY WORKSPACES
    // =====================================

    @Override
    @Transactional(readOnly = true)
    public List<WorkspaceResponse> getMyWorkspaces(String username) {
        User user = getUser(username);

        return workspaceMemberRepository
                .findByMember_Id(user.getId())
                .stream()
                .map(membership ->
                        toResponse(membership.getWorkspace(), user)
                )
                .toList();
    }

    // =====================================
    // GET WORKSPACE DETAIL
    // =====================================

    @Override
    @Transactional(readOnly = true)
    public WorkspaceResponse getWorkspaceById(
            Long workspaceId,
            String username
    ) {
        User user = getUser(username);
        Workspace workspace = getWorkspace(workspaceId);

        getMembership(workspaceId, user);

        return toResponse(workspace, user);
    }

    // =====================================
    // UPDATE WORKSPACE
    // =====================================

    @Override
    public WorkspaceResponse updateWorkspace(
            Long workspaceId,
            UpdateWorkspaceRequest request,
            String username
    ) {
        User user = getUser(username);
        checkPm(user);

        Workspace workspace = getWorkspace(workspaceId);

        getMembership(workspaceId, user);

        workspace.setName(request.getName().trim());
        workspace.setDescription(request.getDescription());
        workspace.setUpdatedAt(LocalDateTime.now());

        Workspace updatedWorkspace =
                workspaceRepository.save(workspace);

        return toResponse(updatedWorkspace, user);
    }

    // =====================================
    // DELETE WORKSPACE
    // =====================================

    @Override
    public void deleteWorkspace(
            Long workspaceId,
            String username
    ) {
        User user = getUser(username);
        checkPm(user);

        Workspace workspace = getWorkspace(workspaceId);

        getMembership(workspaceId, user);

        if (workspace.getAreaList() != null
                && !workspace.getAreaList().isEmpty()) {
            throw new BusinessException(
                    ErrorCode.WORKSPACE_HAS_AREAS
            );
        }

        workspaceMemberRepository
                .deleteAllByWorkspace_Id(workspaceId);

        workspaceRepository.delete(workspace);
    }

    // =====================================
    // GET WORKSPACE MEMBERS
    // =====================================

    @Override
    @Transactional(readOnly = true)
    public List<WorkspaceMemberResponse> getWorkspaceMembers(
            Long workspaceId,
            String username
    ) {
        User currentUser = getUser(username);

        getWorkspace(workspaceId);
        getMembership(workspaceId, currentUser);

        return workspaceMemberRepository
                .findByWorkspace_Id(workspaceId)
                .stream()
                .map(this::toMemberResponse)
                .toList();
    }

    // =====================================
    // ADD WORKSPACE MEMBER
    // =====================================

    @Override
    public WorkspaceMemberResponse addWorkspaceMember(
            Long workspaceId,
            AddWorkspaceMemberRequest request,
            String username
    ) {
        User currentUser = getUser(username);
        checkPm(currentUser);

        Workspace workspace = getWorkspace(workspaceId);
        getMembership(workspaceId, currentUser);

        String email = request.getEmail().trim();

        User newMember = userRepository
                .findByEmailIgnoreCase(email)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.USER_NOT_FOUND)
                );

        if (workspaceMemberRepository
                .existsByWorkspace_IdAndMember_Id(
                        workspaceId,
                        newMember.getId()
                )) {
            throw new BusinessException(
                    ErrorCode.WORKSPACE_MEMBER_ALREADY_EXISTS
            );
        }

        WorkspaceMember membership = new WorkspaceMember();
        membership.setWorkspace(workspace);
        membership.setMember(newMember);
        membership.setJoinedAt(LocalDateTime.now());

        WorkspaceMember saved =
                workspaceMemberRepository.save(membership);

        return toMemberResponse(saved);
    }

    // =====================================
    // REMOVE WORKSPACE MEMBER
    // =====================================

    @Override
    public void removeWorkspaceMember(
            Long workspaceId,
            Long userId,
            String username
    ) {
        User currentUser = getUser(username);
        checkPm(currentUser);

        Workspace workspace = getWorkspace(workspaceId);
        getMembership(workspaceId, currentUser);

        WorkspaceMember target = workspaceMemberRepository
                .findByWorkspace_IdAndMember_Id(
                        workspaceId,
                        userId
                )
                .orElseThrow(() ->
                        new BusinessException(
                                ErrorCode.WORKSPACE_MEMBER_NOT_FOUND
                        ));

        // Không cho xóa người tạo Workspace khỏi danh sách thành viên
        if (workspace.getOwner() != null
                && workspace.getOwner().getId().equals(userId)) {
            throw new BusinessException(
                    ErrorCode.WORKSPACE_OWNER_CANNOT_BE_REMOVED
            );
        }

        workspaceMemberRepository.delete(target);
    }
}