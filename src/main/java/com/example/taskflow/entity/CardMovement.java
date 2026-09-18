package com.example.taskflow.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "card_movements")
@Getter
@Setter
public class CardMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime movedAt;

    @ManyToOne
    @JoinColumn(name = "moved_by")
    private User movedBy;

    @ManyToOne
    @JoinColumn(name = "from_area")
    private Area fromArea;

    @ManyToOne
    @JoinColumn(name = "to_area")
    private Area toArea;

    @ManyToOne
    @JoinColumn(name = "card_id")
    private Card card;
}
