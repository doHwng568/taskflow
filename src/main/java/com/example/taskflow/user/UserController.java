package com.example.taskflow.user;

import com.example.taskflow.common.dto.ApiResponse;
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

    // 1. Lấy danh sách tất cả nhân viên (Chỉ PM)
    @PreAuthorize("hasRole('PM')")
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
}
