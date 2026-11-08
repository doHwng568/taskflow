package com.example.taskflow.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "areas")
@Getter
@Setter
public class Area {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private Double position;

    // Màu nền của area dạng hex, ví dụ "#1E40AF". null = màu mặc định
    private String color;

    // true = đã lưu trữ, không hiện trên board
    private boolean archived = false;

    // true = đã ghim: luôn nằm ở đầu board (các area ghim sắp xếp theo position với nhau)
    private boolean pinned = false;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @ManyToOne
    @JoinColumn(name = "workspace_id")
    private Workspace workspace;

    // Thẻ trong area luôn được sắp xếp theo position tăng dần
    @OneToMany(mappedBy = "area")
    @OrderBy("position ASC")
    private List<Card> cardList = new ArrayList<>();

    @OneToMany(mappedBy = "fromArea")
    private List<CardMovement> fromAreaList = new ArrayList<>();

    @OneToMany(mappedBy = "toArea")
    private List<CardMovement> toAreaList = new ArrayList<>();
}