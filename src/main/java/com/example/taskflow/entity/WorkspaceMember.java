package com.example.taskflow.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "workspace_members")
@Getter
@Setter
public class WorkspaceMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String role;

    private LocalDateTime joinedAt;

    @ManyToOne
    @JoinColumn(name = "member_id")
    private User member;

    @ManyToOne
    @JoinColumn(name = "workspace_id")
    private Workspace workspace;
}
