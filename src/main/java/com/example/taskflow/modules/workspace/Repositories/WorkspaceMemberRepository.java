
package com.example.taskflow.modules.workspace.Repositories;

import com.example.taskflow.common.enums.WorkspaceRole;
import com.example.taskflow.entity.User;
import com.example.taskflow.entity.Workspace;
import com.example.taskflow.entity.WorkspaceMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceMemberRepository
        extends JpaRepository<WorkspaceMember, Long> {

    boolean existsByMemberAndWorkspace(
            User member,
            Workspace workspace
    );

    Optional<WorkspaceMember> findByMemberAndWorkspace(
            User member,
            Workspace workspace
    );

    List<WorkspaceMember> findByWorkspace_Id(Long workspaceId);

    List<WorkspaceMember> findByMember_Id(Long memberId);

    Optional<WorkspaceMember> findByWorkspace_IdAndMember_Id(
            Long workspaceId,
            Long memberId
    );

    boolean existsByWorkspace_IdAndMember_Id(
            Long workspaceId,
            Long memberId
    );

    long countByWorkspace_Id(Long workspaceId);

    long countByWorkspace_IdAndRole(
            Long workspaceId,
            WorkspaceRole role
    );

    void deleteAllByWorkspace_Id(Long workspaceId);
}
