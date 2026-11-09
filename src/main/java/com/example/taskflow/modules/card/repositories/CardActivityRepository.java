package com.example.taskflow.modules.card.repositories;

import com.example.taskflow.entity.CardActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CardActivityRepository extends JpaRepository<CardActivity, Long> {

    List<CardActivity> findByCard_IdOrderByCreatedAtDesc(Long cardId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from CardActivity a where a.card.id = :cardId")
    void deleteByCardId(@Param("cardId") Long cardId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from CardActivity a where a.card.id in (select c.id from Card c where c.area.id = :areaId)")
    void deleteByCardsInArea(@Param("areaId") Long areaId);
}

