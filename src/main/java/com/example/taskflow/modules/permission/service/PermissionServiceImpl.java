package com.example.taskflow.modules.permission.service;

import com.example.taskflow.common.enums.Role;
import com.example.taskflow.entity.Permission;
import com.example.taskflow.entity.RolePermission;
import com.example.taskflow.modules.permission.dto.request.UpdatePermissionMatrixRequest;
import com.example.taskflow.modules.permission.dto.response.PermissionMatrixResponse;
import com.example.taskflow.modules.permission.dto.response.PermissionResponse;
import com.example.taskflow.modules.permission.repository.PermissionRepository;
import com.example.taskflow.modules.permission.repository.RolePermissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class PermissionServiceImpl implements PermissionService {

    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;

    public PermissionServiceImpl(
            PermissionRepository permissionRepository,
            RolePermissionRepository rolePermissionRepository
    ) {
        this.permissionRepository = permissionRepository;
        this.rolePermissionRepository = rolePermissionRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PermissionMatrixResponse getMatrix() {
        // 1. Lấy danh sách 12 permissions xếp theo module
        List<PermissionResponse> permissionResponses = permissionRepository
                .findAllByOrderByModuleAscIdAsc()
                .stream()
                .map(PermissionResponse::fromEntity)
                .toList();

        // 2. Lấy danh sách quyền của từng Role
        Map<String, List<String>> matrix = new LinkedHashMap<>();
        for (Role role : Role.values()) {
            List<String> permNames = rolePermissionRepository.findByRole(role)
                    .stream()
                    .map(rp -> rp.getPermission().getName())
                    .toList();
            matrix.put(role.name(), permNames);
        }

        return new PermissionMatrixResponse(permissionResponses, matrix);
    }

    @Override
    @Transactional
    public void updateMatrix(UpdatePermissionMatrixRequest request) {
        Map<String, List<String>> newMatrix = request.matrix();
        if (newMatrix == null) return;

        // Tải sẵn toàn bộ permissions trong DB vào Map theo name để tra cứu nhanh
        Map<String, Permission> permissionMap = new HashMap<>();
        for (Permission p : permissionRepository.findAll()) {
            permissionMap.put(p.getName(), p);
        }

        // Duyệt qua từng Role được cập nhật
        for (Map.Entry<String, List<String>> entry : newMatrix.entrySet()) {
            String roleName = entry.getKey();
            Role role;
            try {
                role = Role.valueOf(roleName);
            } catch (IllegalArgumentException e) {
                continue; // Bỏ qua nếu role không hợp lệ
            }

            // Xóa toàn bộ quyền cũ của role này
            rolePermissionRepository.deleteByRole(role);

            // Gán danh sách quyền mới được tick chọn
            List<String> selectedPermNames = entry.getValue();
            List<RolePermission> toSave = new ArrayList<>();

            // Riêng PM luôn đảm bảo giữ trọn vẹn 12 quyền (không thể tự tước quyền của chính mình)
            if (role == Role.PM) {
                for (Permission p : permissionMap.values()) {
                    toSave.add(new RolePermission(Role.PM, p));
                }
            } else if (selectedPermNames != null) {
                for (String permName : selectedPermNames) {
                    Permission p = permissionMap.get(permName);
                    if (p != null) {
                        toSave.add(new RolePermission(role, p));
                    }
                }
            }

            if (!toSave.isEmpty()) {
                rolePermissionRepository.saveAll(toSave);
            }
        }
    }
}

