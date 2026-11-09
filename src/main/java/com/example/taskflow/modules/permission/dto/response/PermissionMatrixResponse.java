package com.example.taskflow.modules.permission.dto.response;

import java.util.List;
import java.util.Map;

/**
 * Trả về toàn bộ danh mục 12 quyền và ma trận quyền hiện tại của từng vai trò
 */
public record PermissionMatrixResponse(
        List<PermissionResponse> permissions,
        Map<String, List<String>> matrix
) {}

