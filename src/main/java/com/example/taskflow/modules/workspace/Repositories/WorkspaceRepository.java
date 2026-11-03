package com.example.taskflow.modules.workspace.Repositories;

import com.example.taskflow.entity.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {

    // Tìm workspace theo ID – dùng trong CardService/CardMovementService để
    // validate
    Optional<Workspace> findById(Long id);
}
