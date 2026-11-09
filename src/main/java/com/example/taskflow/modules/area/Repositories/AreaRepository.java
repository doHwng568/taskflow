package com.example.taskflow.modules.area.Repositories;

import com.example.taskflow.entity.Area;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AreaRepository extends JpaRepository<Area, Long> {

    // Lấy tất cả area của một workspace (cả đã lưu trữ), sắp xếp theo position tăng dần
    List<Area> findByWorkspace_IdOrderByPositionAsc(Long workspaceId);

    // Lấy tất cả area của một workspace: ghim lên đầu, sau đó theo position tăng dần
    List<Area> findByWorkspace_IdOrderByPinnedDescPositionAsc(Long workspaceId);

    // Area CHƯA lưu trữ kèm thẻ con và người tạo/giao việc, 1 câu query (join fetch tránh N+1).
    // Thứ tự thẻ lấy từ @OrderBy ở Area.cardList.
    @Query("""
            select distinct a from Area a
            left join fetch a.cardList c
            left join fetch c.createdBy
            left join fetch c.assignee
            where a.workspace.id = :workspaceId and a.archived = false
            order by a.pinned desc, a.position asc
            """)
    List<Area> findActiveWithCards(@Param("workspaceId") Long workspaceId);

    // Area ĐÃ lưu trữ kèm thẻ con và người tạo/giao việc (cho màn hình "Đã lưu trữ")
    @Query("""
            select distinct a from Area a
            left join fetch a.cardList c
            left join fetch c.createdBy
            left join fetch c.assignee
            where a.workspace.id = :workspaceId and a.archived = true
            order by a.pinned desc, a.position asc
            """)
    List<Area> findArchivedWithCards(@Param("workspaceId") Long workspaceId);

    // Position lớn nhất của workspace (tính cả area đã lưu trữ để không trùng vị trí).
    @Query("select max(a.position) from Area a where a.workspace.id = :workspaceId")
    Optional<Double> findMaxPositionByWorkspaceId(@Param("workspaceId") Long workspaceId);
}