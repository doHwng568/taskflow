package com.example.taskflow.user;

import com.example.taskflow.common.dto.ApiResponse;
import com.example.taskflow.user.dto.request.ChangePasswordRequest;
import com.example.taskflow.user.dto.request.UpdateProfileRequest;
import com.example.taskflow.user.dto.request.UpdateUserRoleRequest;
import com.example.taskflow.user.dto.response.UserResponse;
import com.example.taskflow.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // 1. Lấy danh sách người dùng trong hệ thống để phân quyền / giao nhiệm vụ
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success(users, "Lấy danh sách người dùng thành công"));
    }

    // 2. Cập nhật vai trò (Role) cho một nhân viên (Chỉ PM)
    @PreAuthorize("hasRole('PM')")
    @PutMapping("/{id}/role")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRoleRequest request,
            Authentication authentication
    ) {
        String currentUsername = authentication.getName();
        UserResponse updatedUser = userService.updateUserRole(id, request.role(), currentUsername);
        return ResponseEntity.ok(ApiResponse.success(updatedUser, "Cập nhật vai trò thành công"));
    }

    // 3. Xem thông tin cá nhân (Profile) của chính mình
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> getProfile(Authentication authentication) {
        String currentUsername = authentication.getName();
        UserResponse profile = userService.getProfile(currentUsername);
        return ResponseEntity.ok(ApiResponse.success(profile, "Lấy thông tin cá nhân thành công"));
    }

    // 4. Cập nhật thông tin cá nhân (Họ và tên)
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication
    ) {
        String currentUsername = authentication.getName();
        UserResponse updatedProfile = userService.updateProfile(currentUsername, request);
        return ResponseEntity.ok(ApiResponse.success(updatedProfile, "Cập nhật thông tin cá nhân thành công"));
    }

    // 5. Đổi mật khẩu
    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication
    ) {
        String currentUsername = authentication.getName();
        userService.changePassword(currentUsername, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Đổi mật khẩu thành công"));
    }
}
