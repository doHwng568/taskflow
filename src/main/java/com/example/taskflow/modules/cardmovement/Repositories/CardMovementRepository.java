package com.example.taskflow.modules.cardmovement.Repositories;

import com.example.taskflow.entity.CardMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CardMovementRepository extends JpaRepository<CardMovement, Long> {

    // Lấy lịch sử di chuyển của một card, sắp xếp mới nhất lên đầu
    // CardMovement.card là @ManyToOne → Card.id là field ID của card
    // CardMovement.movedAt là LocalDateTime → sort DESC hợp lệ
    List<CardMovement> findByCard_IdOrderByMovedAtDesc(Long cardId);
    // Xóa lịch sử di chuyển của các thẻ đang nằm trong area (các thẻ này sắp bị xóa)
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from CardMovement m where m.card.id in (select c.id from Card c where c.area.id = :areaId)")
    int deleteByCardsInArea(@Param("areaId") Long areaId);

    // Lịch sử của thẻ ở area khác từng đi qua area này: giữ lại bản ghi, chỉ bỏ tham chiếu
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update CardMovement m set m.fromArea = null where m.fromArea.id = :areaId")
    int clearFromArea(@Param("areaId") Long areaId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update CardMovement m set m.toArea = null where m.toArea.id = :areaId")
    int clearToArea(@Param("areaId") Long areaId);
}
