package com.example.taskflow.modules.permission.repository;

import com.example.taskflow.common.enums.Role;
import com.example.taskflow.entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {

    List<RolePermission> findByRole(Role role);

    void deleteByRole(Role role);

    boolean existsByRoleAndPermission_Name(Role role, String permissionName);
}
