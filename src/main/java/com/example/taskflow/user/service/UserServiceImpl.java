package com.example.taskflow.user.service;

import com.example.taskflow.common.enums.ErrorCode;
import com.example.taskflow.common.enums.Role;
import com.example.taskflow.common.exception.BusinessException;
import com.example.taskflow.entity.User;
import com.example.taskflow.user.UserRepository;
import com.example.taskflow.user.dto.request.ChangePasswordRequest;
import com.example.taskflow.user.dto.request.UpdateProfileRequest;
import com.example.taskflow.user.dto.response.UserResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
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

    @Override
    @Transactional(readOnly = true)
    public UserResponse getProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return UserResponse.fromEntity(user);
    }

    @Override
    @Transactional
    public UserResponse updateProfile(String username, UpdateProfileRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        user.setFullName(request.fullName());
        User savedUser = userRepository.save(user);

        return UserResponse.fromEntity(savedUser);
    }

    @Override
    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // Kiểm tra mật khẩu cũ có khớp không
        if (!passwordEncoder.matches(request.oldPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.OLD_PASSWORD_INCORRECT);
        }

        // Mã hóa và lưu mật khẩu mới
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }
}

