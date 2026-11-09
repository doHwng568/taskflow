package com.example.taskflow.user.service;

import com.example.taskflow.common.enums.Role;
import com.example.taskflow.user.dto.response.UserResponse;

import java.util.List;

public interface UserService {

    List<UserResponse> getAllUsers();

    UserResponse updateUserRole(Long userId, Role newRole, String currentUsername);
}

