package com.example.taskflow.modules.user.service;

import com.example.taskflow.common.enums.ErrorCode;
import com.example.taskflow.common.enums.Role;
import com.example.taskflow.common.exception.BusinessException;
import com.example.taskflow.entity.User;
import com.example.taskflow.modules.user.UserRepository;
import com.example.taskflow.modules.user.dto.request.ChangePasswordRequest;
import com.example.taskflow.modules.user.dto.request.UpdateProfileRequest;
import com.example.taskflow.modules.user.dto.response.UserResponse;
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
    public UserResponse updateUserRole(Long userId, Role newRole) {
        // get user by id
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // update role
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

        String newEmail = request.email().trim();

        // check valid email
        if (user.getEmail() == null || !user.getEmail().equalsIgnoreCase(newEmail)) {
            userRepository.findByEmailIgnoreCase(newEmail).ifPresent(existingUser -> {
                if (!existingUser.getId().equals(user.getId())) {
                    throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
                }
            });
        }

        user.setFullName(request.fullName().trim());
        user.setEmail(newEmail);
        User savedUser = userRepository.save(user);

        return UserResponse.fromEntity(savedUser);
    }

    @Override
    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // check old password
        if (!passwordEncoder.matches(request.oldPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.OLD_PASSWORD_INCORRECT);
        }

        // save new password
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }
}
