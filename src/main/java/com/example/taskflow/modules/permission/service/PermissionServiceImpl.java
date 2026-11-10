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
            RolePermissionRepository rolePermissionRepository) {
        this.permissionRepository = permissionRepository;
        this.rolePermissionRepository = rolePermissionRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PermissionMatrixResponse getMatrix() {
        // get list permission
        List<PermissionResponse> permissionResponses = permissionRepository
                .findAllByOrderByModuleAscIdAsc()
                .stream()
                .map(PermissionResponse::fromEntity)
                .toList();

        // get matrix permission
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
        if (newMatrix == null)
            return;

        // map permission by name
        Map<String, Permission> permissionMap = new HashMap<>();
        for (Permission p : permissionRepository.findAll()) {
            permissionMap.put(p.getName(), p);
        }

        // iterate role
        for (Map.Entry<String, List<String>> entry : newMatrix.entrySet()) {
            String roleName = entry.getKey();
            Role role;
            try {
                role = Role.valueOf(roleName);
            } catch (IllegalArgumentException e) {
                // skip invalid role
                continue;
            }

            // PM has all permissions
            if (role == Role.PM) {
                continue;
            }

            // delete all old permissions of this role and flush to DB
            rolePermissionRepository.deleteByRole(role);
            rolePermissionRepository.flush();

            // save new permission
            List<String> selectedPermNames = entry.getValue();
            List<RolePermission> toSave = new ArrayList<>();

            if (selectedPermNames != null) {
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
