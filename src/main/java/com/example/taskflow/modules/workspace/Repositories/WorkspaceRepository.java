package com.example.taskflow.modules.workspace.Repositories;

import com.example.taskflow.entity.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkspaceRepository
        extends JpaRepository<Workspace, Long> {
}