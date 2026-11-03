package com.example.taskflow.modules.area.Repositories;

import com.example.taskflow.entity.Area;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AreaRepository extends JpaRepository<Area, Long> {

    // Tìm area theo ID – dùng khi validate toArea trong MoveCardRequest
    Optional<Area> findById(Long id);

    // Lấy tất cả area của một workspace, sắp xếp theo position tăng dần
    // Area.workspace là @ManyToOne → Workspace.id là field ID của workspace
    // Spring Data JPA suy ra: SELECT a FROM Area a WHERE a.workspace.id =
    // :workspaceId ORDER BY a.position ASC
    List<Area> findByWorkspace_IdOrderByPositionAsc(Long workspaceId);
}
