package com.example.taskflow.modules.cardmovement.Repositories;

import com.example.taskflow.entity.CardMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CardMovementRepository extends JpaRepository<CardMovement, Long> {

    // Lấy lịch sử di chuyển của một card, sắp xếp mới nhất lên đầu
    // CardMovement.card là @ManyToOne → Card.id là field ID của card
    // CardMovement.movedAt là LocalDateTime → sort DESC hợp lệ
    List<CardMovement> findByCard_IdOrderByMovedAtDesc(Long cardId);
}
