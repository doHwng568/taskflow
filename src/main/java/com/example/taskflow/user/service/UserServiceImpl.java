package com.example.taskflow.user.service;

import com.example.taskflow.common.enums.ErrorCode;
import com.example.taskflow.common.enums.Role;
import com.example.taskflow.common.exception.BusinessException;
import com.example.taskflow.entity.User;
import com.example.taskflow.user.UserRepository;
import com.example.taskflow.user.dto.response.UserResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(User::getId))
                .map(UserResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public UserResponse updateUserRole(Long userId, Role newRole, String currentUsername) {
        // 1. Tìm user theo id
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 2. Chặn không cho PM tự đổi role của chính mình
        if (user.getUsername().equalsIgnoreCase(currentUsername)) {
            throw new BusinessException(ErrorCode.CANNOT_CHANGE_OWN_ROLE);
        }

        // 3. Cập nhật role mới
        user.setRole(newRole);
        User savedUser = userRepository.save(user);

        return UserResponse.fromEntity(savedUser);
    }
}

