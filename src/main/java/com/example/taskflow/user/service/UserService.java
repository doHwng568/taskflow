package com.example.taskflow.user.service;

import com.example.taskflow.common.enums.Role;
import com.example.taskflow.user.dto.request.ChangePasswordRequest;
import com.example.taskflow.user.dto.request.UpdateProfileRequest;
import com.example.taskflow.user.dto.response.UserResponse;

import java.util.List;

public interface UserService {

    List<UserResponse> getAllUsers();

    UserResponse updateUserRole(Long userId, Role newRole, String currentUsername);

    UserResponse getProfile(String username);

    UserResponse updateProfile(String username, UpdateProfileRequest request);

    void changePassword(String username, ChangePasswordRequest request);
}

