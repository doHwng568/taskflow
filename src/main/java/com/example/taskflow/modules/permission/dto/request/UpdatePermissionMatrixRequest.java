package com.example.taskflow.modules.permission.dto.request;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

/**
 * DTO nhận dữ liệu ma trận quyền từ PM gửi lên để lưu vào DB
 */
public record UpdatePermissionMatrixRequest(
        @NotNull(message = "Matrix data cannot be null")
        Map<String, List<String>> matrix
) {}

