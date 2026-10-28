package com.example.taskflow.modules.workspace.Repositories;

import com.example.taskflow.entity.User;
import com.example.taskflow.entity.Workspace;
import com.example.taskflow.entity.WorkspaceMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, Long> {

    // Kiểm tra user có phải member của workspace hay không – dùng để authorize
    // moveCard
    // WorkspaceMember.member là @ManyToOne User, WorkspaceMember.workspace là
    // @ManyToOne Workspace
    // Spring Data JPA suy ra: SELECT COUNT(*) > 0 FROM workspace_members WHERE
    // member_id = ? AND workspace_id = ?
    boolean existsByMemberAndWorkspace(User member, Workspace workspace);
}
