package com.example.taskflow.entity;


import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
//@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    private String password;

    @OneToMany(mappedBy = "user")
    private List<RefreshToken> refreshTokenList = new ArrayList<>();

    @OneToMany(mappedBy = "owner")
    private List<Workspace> workspaceList = new ArrayList<>();

    @OneToMany(mappedBy = "member")
    private List<WorkspaceMember> workspaceMemberList = new ArrayList<>();

    @OneToMany(mappedBy = "createdBy")
    private List<Card> createdBy = new ArrayList<>();

    @OneToMany(mappedBy = "assignee")
    private List<Card> assignee = new ArrayList<>();

    @OneToMany(mappedBy = "movedBy")
    private List<CardMovement> cardMovementList = new ArrayList<>();
}