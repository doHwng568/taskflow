
package com.example.taskflow.modules.workspace.service;

import com.example.taskflow.common.enums.ErrorCode;
import com.example.taskflow.common.enums.WorkspaceRole;
import com.example.taskflow.common.exception.BusinessException;
import com.example.taskflow.entity.User;
import com.example.taskflow.entity.Workspace;
import com.example.taskflow.entity.WorkspaceMember;
import com.example.taskflow.modules.workspace.Repositories.WorkspaceMemberRepository;
import com.example.taskflow.modules.workspace.Repositories.WorkspaceRepository;
import com.example.taskflow.modules.workspace.dto.request.AddWorkspaceMemberRequest;
import com.example.taskflow.modules.workspace.dto.request.CreateWorkspaceRequest;
import com.example.taskflow.modules.workspace.dto.request.TransferWorkspaceOwnershipRequest;
import com.example.taskflow.modules.workspace.dto.request.UpdateWorkspaceMemberRoleRequest;
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

    // ==============================
    // COMMON METHODS
    // ==============================

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

    private WorkspaceMember getTargetMembership(
            Long workspaceId,
            Long userId
    ) {
        return workspaceMemberRepository
                .findByWorkspace_IdAndMember_Id(
                        workspaceId,
                        userId
                )
                .orElseThrow(() ->
                        new BusinessException(
                                ErrorCode.WORKSPACE_MEMBER_NOT_FOUND
                        ));
    }

    private void checkAdminPermission(WorkspaceMember membership) {
        WorkspaceRole role = membership.getRole();

        if (role != WorkspaceRole.OWNER
                && role != WorkspaceRole.ADMIN) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }
    }

    private void checkOwnerPermission(WorkspaceMember membership) {
        if (membership.getRole() != WorkspaceRole.OWNER) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }
    }

    private WorkspaceResponse toResponse(
            Workspace workspace,
            WorkspaceRole currentRole
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
                .ownerUsername(workspace.getOwner() != null ? workspace.getOwner().getUsername() : null)
                .currentUserRole(currentRole)
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
                .role(membership.getRole())
                .joinedAt(membership.getJoinedAt())
                .build();
    }

    // ==============================
    // WORKSPACE CRUD
    // ==============================

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

        WorkspaceMember membership = new WorkspaceMember();
        membership.setWorkspace(savedWorkspace);
        membership.setMember(user);
        membership.setRole(WorkspaceRole.OWNER);
        membership.setJoinedAt(now);

        workspaceMemberRepository.save(membership);

        return toResponse(savedWorkspace, WorkspaceRole.OWNER);
    }

    @Override
    public List<WorkspaceResponse> getMyWorkspaces(String username) {
        if (username == null || username.isBlank()) {
            return workspaceRepository.findAll().stream()
                    .map(ws -> toResponse(ws, WorkspaceRole.OWNER))
                    .toList();
        }
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return workspaceRepository.findAll().stream()
                    .map(ws -> toResponse(ws, WorkspaceRole.OWNER))
                    .toList();
        }

        List<WorkspaceMember> memberships =
                workspaceMemberRepository.findByMember_Id(user.getId());

        if (memberships.isEmpty()) {
            return workspaceRepository.findAll().stream()
                    .map(ws -> toResponse(ws, WorkspaceRole.OWNER))
                    .toList();
        }

        return memberships.stream()
                .map(membership ->
                        toResponse(
                                membership.getWorkspace(),
                                membership.getRole()
                        )
                )
                .toList();
    }

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

    @Override
    public void deleteWorkspace(
            Long workspaceId,
            String username
    ) {
        User user = getUser(username);
        Workspace workspace = getWorkspace(workspaceId);

        WorkspaceMember membership =
                getMembership(workspaceId, user);

        checkOwnerPermission(membership);

        if (!workspace.getAreaList().isEmpty()) {
            throw new BusinessException(
                    ErrorCode.WORKSPACE_HAS_AREAS
            );
        }

        workspaceMemberRepository
                .deleteAllByWorkspace_Id(workspaceId);

        workspaceRepository.delete(workspace);
    }

    // ==============================
    // WORKSPACE MEMBER MANAGEMENT
    // ==============================

    // 1. GET MEMBERS
    @Override
    public List<WorkspaceMemberResponse> getWorkspaceMembers(
            Long workspaceId,
            String username
    ) {
        User currentUser = getUser(username);

        // Only workspace members can view the member list
        getMembership(workspaceId, currentUser);

        return workspaceMemberRepository
                .findByWorkspace_Id(workspaceId)
                .stream()
                .map(this::toMemberResponse)
                .toList();
    }

    // 2. ADD MEMBER

    @Override
    public WorkspaceMemberResponse addWorkspaceMember(
            Long workspaceId,
            AddWorkspaceMemberRequest request,
            String username
    ) {
        // 1. Get current logged-in user
        User currentUser = getUser(username);

        // 2. Check Workspace exists
        Workspace workspace = getWorkspace(workspaceId);

        // 3. Check current user's Workspace permission
        WorkspaceMember currentMembership =
                getMembership(workspaceId, currentUser);

        checkAdminPermission(currentMembership);

        // 4. Find target user by email
        String email = request.getEmail().trim();

        User newMember = userRepository
                .findByEmailIgnoreCase(email)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.USER_NOT_FOUND)
                );

        // 5. Prevent adding yourself
        if (newMember.getId().equals(currentUser.getId())) {
            throw new BusinessException(
                    ErrorCode.WORKSPACE_MEMBER_ALREADY_EXISTS
            );
        }

        // 6. Prevent duplicate membership
        if (workspaceMemberRepository.existsByWorkspace_IdAndMember_Id(
                workspaceId,
                newMember.getId()
        )) {
            throw new BusinessException(
                    ErrorCode.WORKSPACE_MEMBER_ALREADY_EXISTS
            );
        }

        // 7. Validate Workspace role
        WorkspaceRole requestedRole = request.getRole();

        // OWNER cannot be assigned through Add Member API
        if (requestedRole == WorkspaceRole.OWNER) {
            throw new BusinessException(
                    ErrorCode.INVALID_WORKSPACE_ROLE
            );
        }

        // ADMIN can only add MEMBER
        if (currentMembership.getRole() == WorkspaceRole.ADMIN
                && requestedRole != WorkspaceRole.MEMBER) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }

        // 8. Create Workspace membership
        WorkspaceMember membership = new WorkspaceMember();

        membership.setWorkspace(workspace);
        membership.setMember(newMember);
        membership.setRole(requestedRole);
        membership.setJoinedAt(LocalDateTime.now());

        // 9. Save membership
        WorkspaceMember savedMembership =
                workspaceMemberRepository.save(membership);

        return toMemberResponse(savedMembership);
    }


    // 3. UPDATE MEMBER ROLE
    @Override
    public WorkspaceMemberResponse updateMemberRole(
            Long workspaceId,
            Long userId,
            UpdateWorkspaceMemberRoleRequest request,
            String username
    ) {
        User currentUser = getUser(username);

        WorkspaceMember currentMembership =
                getMembership(workspaceId, currentUser);

        // Only OWNER can change roles
        checkOwnerPermission(currentMembership);

        WorkspaceMember targetMembership =
                getTargetMembership(workspaceId, userId);

        // Cannot change OWNER role
        if (targetMembership.getRole() == WorkspaceRole.OWNER) {
            throw new BusinessException(
                    ErrorCode.INVALID_WORKSPACE_ROLE
            );
        }

        WorkspaceRole newRole = request.getRole();

        // OWNER can only assign ADMIN or MEMBER
        if (newRole == WorkspaceRole.OWNER) {
            throw new BusinessException(
                    ErrorCode.INVALID_WORKSPACE_ROLE
            );
        }

        targetMembership.setRole(newRole);

        WorkspaceMember updatedMembership =
                workspaceMemberRepository.save(targetMembership);

        return toMemberResponse(updatedMembership);
    }

    // 4. REMOVE MEMBER
    @Override
    public void removeWorkspaceMember(
            Long workspaceId,
            Long userId,
            String username
    ) {
        User currentUser = getUser(username);
        Workspace workspace = getWorkspace(workspaceId);

        WorkspaceMember currentMembership =
                getMembership(workspaceId, currentUser);

        WorkspaceMember targetMembership =
                getTargetMembership(workspaceId, userId);

        // Cannot remove yourself using this API
        if (currentUser.getId().equals(userId)) {
            throw new BusinessException(
                    ErrorCode.WORKSPACE_OWNER_CANNOT_BE_REMOVED
            );
        }

        WorkspaceRole currentRole = currentMembership.getRole();
        WorkspaceRole targetRole = targetMembership.getRole();

        // OWNER can remove ADMIN or MEMBER
        if (currentRole == WorkspaceRole.OWNER) {

            if (targetRole == WorkspaceRole.OWNER) {
                throw new BusinessException(
                        ErrorCode.WORKSPACE_OWNER_CANNOT_BE_REMOVED
                );
            }

            // ADMIN can only remove MEMBER
        } else if (currentRole == WorkspaceRole.ADMIN) {

            if (targetRole != WorkspaceRole.MEMBER) {
                throw new BusinessException(
                        ErrorCode.ACCESS_DENIED
                );
            }

        } else {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }

        workspaceMemberRepository.delete(targetMembership);
    }

    // 5. TRANSFER OWNERSHIP
    @Override
    public WorkspaceResponse transferOwnership(
            Long workspaceId,
            TransferWorkspaceOwnershipRequest request,
            String username
    ) {
        User currentUser = getUser(username);
        Workspace workspace = getWorkspace(workspaceId);

        WorkspaceMember currentMembership =
                getMembership(workspaceId, currentUser);

        checkOwnerPermission(currentMembership);

        Long newOwnerId = request.getNewOwnerId();

        if (currentUser.getId().equals(newOwnerId)) {
            throw new BusinessException(
                    ErrorCode.INVALID_OWNERSHIP_TRANSFER
            );
        }

        WorkspaceMember newOwnerMembership =
                getTargetMembership(workspaceId, newOwnerId);

        // Old OWNER becomes ADMIN
        currentMembership.setRole(WorkspaceRole.ADMIN);

        // New OWNER becomes OWNER
        newOwnerMembership.setRole(WorkspaceRole.OWNER);

        // Update workspace owner reference
        workspace.setOwner(newOwnerMembership.getMember());
        workspace.setUpdatedAt(LocalDateTime.now());

        workspaceMemberRepository.save(currentMembership);
        workspaceMemberRepository.save(newOwnerMembership);
        workspaceRepository.save(workspace);

        return toResponse(workspace, WorkspaceRole.ADMIN);
    }
}
