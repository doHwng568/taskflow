package com.example.taskflow.modules.permission.service;

import com.example.taskflow.modules.permission.dto.request.UpdatePermissionMatrixRequest;
import com.example.taskflow.modules.permission.dto.response.PermissionMatrixResponse;

public interface PermissionService {

    // get matrix permission
    PermissionMatrixResponse getMatrix();

    // update matrix permission
    void updateMatrix(UpdatePermissionMatrixRequest request);
}
