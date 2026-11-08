package com.example.taskflow.modules.permission.service;

import com.example.taskflow.modules.permission.dto.request.UpdatePermissionMatrixRequest;
import com.example.taskflow.modules.permission.dto.response.PermissionMatrixResponse;

public interface PermissionService {

    // Lấy toàn bộ 12 quyền và ma trận quyền hiện tại
    PermissionMatrixResponse getMatrix();

    // Lưu ma trận phân quyền mới vào database
    void updateMatrix(UpdatePermissionMatrixRequest request);
}

