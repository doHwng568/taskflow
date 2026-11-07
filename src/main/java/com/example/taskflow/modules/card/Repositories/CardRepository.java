package com.example.taskflow.modules.card.Repositories;

import com.example.taskflow.entity.Area;
import com.example.taskflow.entity.Card;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CardRepository extends JpaRepository<Card, Long> {

    // Tìm card theo ID – dùng khi validate cardId trong MoveCardRequest
    Optional<Card> findById(Long id);

    // Lấy tất cả card thuộc một area, sắp xếp theo position tăng dần để hiển thị
    // đúng thứ tự
    // Card.area là @ManyToOne → Area.id là field ID của area
    // Spring Data JPA suy ra: SELECT c FROM Card c WHERE c.area.id = :areaId ORDER
    // BY c.position ASC
    List<Card> findByArea_IdOrderByPositionAsc(Long areaId);

    // Tìm position lớn nhất trong area – dùng trong CardService khi tính position
    // cho card mới hoặc card vừa được move vào
    // Trả Optional<Double> để xử lý trường hợp area rỗng (sẽ dùng 0.0 làm mặc định)
    Optional<Double> findTopByArea_IdOrderByPositionDesc(Long areaId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from Card c where c.area.id = :areaId")
    int bulkDeleteByAreaId(@Param("areaId") Long areaId);



}
