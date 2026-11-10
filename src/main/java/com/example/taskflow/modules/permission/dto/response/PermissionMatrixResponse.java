package com.example.taskflow.modules.permission.dto.response;

import java.util.List;
import java.util.Map;

/**
 * get matrix permission
 */
public record PermissionMatrixResponse(
                List<PermissionResponse> permissions,
                Map<String, List<String>> matrix) {
}
