package com.example.taskflow.modules.user.service;

import com.example.taskflow.common.enums.Role;
import com.example.taskflow.modules.user.dto.request.ChangePasswordRequest;
import com.example.taskflow.modules.user.dto.request.UpdateProfileRequest;
import com.example.taskflow.modules.user.dto.response.UserResponse;

import java.util.List;

public interface UserService {

    List<UserResponse> getAllUsers();

    UserResponse updateUserRole(Long userId, Role newRole);

    UserResponse getProfile(String username);

    UserResponse updateProfile(String username, UpdateProfileRequest request);

    void changePassword(String username, ChangePasswordRequest request);
}

