package com.example.taskflow.modules.permission.seeder;

import com.example.taskflow.common.enums.Role;
import com.example.taskflow.entity.Permission;
import com.example.taskflow.entity.RolePermission;
import com.example.taskflow.modules.permission.repository.PermissionRepository;
import com.example.taskflow.modules.permission.repository.RolePermissionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Tự động khởi tạo 12 quyền CRUD cơ bản và nạp quyền ban đầu cho các Role khi ứng dụng khởi động.
 */
@Component
public class PermissionDataSeeder implements CommandLineRunner {

    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;

    public PermissionDataSeeder(
            PermissionRepository permissionRepository,
            RolePermissionRepository rolePermissionRepository
    ) {
        this.permissionRepository = permissionRepository;
        this.rolePermissionRepository = rolePermissionRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // Chỉ khởi tạo khi bảng permissions chưa có dữ liệu
        if (permissionRepository.count() == 0) {
            Map<String, Permission> permissionMap = seedPermissions();
            seedRolePermissions(permissionMap);
            System.out.println(">>> [TaskFlow] Đã khởi tạo thành công 12 Permissions và quyền mặc định cho các Role.");
        }
    }

    private Map<String, Permission> seedPermissions() {
        List<Permission> permissions = List.of(
                // 1. Module WORKSPACE (4 features)
                new Permission("WORKSPACE_VIEW", "Xem Workspace", "WORKSPACE"),
                new Permission("WORKSPACE_CREATE", "Tạo Workspace mới", "WORKSPACE"),
                new Permission("WORKSPACE_UPDATE", "Sửa thông tin Workspace", "WORKSPACE"),
                new Permission("WORKSPACE_DELETE", "Xóa Workspace", "WORKSPACE"),

                // 2. Module AREA (4 features)
                new Permission("AREA_VIEW", "Xem cột Kanban", "AREA"),
                new Permission("AREA_CREATE", "Thêm cột mới", "AREA"),
                new Permission("AREA_UPDATE", "Sửa cột (đổi tên, vị trí)", "AREA"),
                new Permission("AREA_DELETE", "Xóa cột", "AREA"),

                // 3. Module CARD (4 features)
                new Permission("CARD_VIEW", "Xem chi tiết thẻ", "CARD"),
                new Permission("CARD_CREATE", "Tạo thẻ mới (Task / Bug)", "CARD"),
                new Permission("CARD_UPDATE", "Cập nhật / Kéo thả thẻ", "CARD"),
                new Permission("CARD_DELETE", "Xóa thẻ khỏi bảng", "CARD")
        );

        List<Permission> savedPermissions = permissionRepository.saveAll(permissions);
        Map<String, Permission> map = new HashMap<>();
        for (Permission p : savedPermissions) {
            map.put(p.getName(), p);
        }
        return map;
    }

    private void seedRolePermissions(Map<String, Permission> map) {
        List<RolePermission> rolePermissions = new ArrayList<>();

        // 1. PM: Có toàn bộ 12/12 quyền
        for (Permission p : map.values()) {
            rolePermissions.add(new RolePermission(Role.PM, p));
        }

        // 2. LEADER: 8 quyền
        List<String> leaderPerms = List.of(
                "WORKSPACE_VIEW",
                "AREA_VIEW", "AREA_CREATE", "AREA_UPDATE",
                "CARD_VIEW", "CARD_CREATE", "CARD_UPDATE", "CARD_DELETE"
        );
        for (String permName : leaderPerms) {
            if (map.containsKey(permName)) {
                rolePermissions.add(new RolePermission(Role.LEADER, map.get(permName)));
            }
        }

        // 3. DEV: 5 quyền (chủ động tạo và sửa task/bug)
        List<String> devPerms = List.of(
                "WORKSPACE_VIEW",
                "AREA_VIEW",
                "CARD_VIEW", "CARD_CREATE", "CARD_UPDATE"
        );
        for (String permName : devPerms) {
            if (map.containsKey(permName)) {
                rolePermissions.add(new RolePermission(Role.DEV, map.get(permName)));
            }
        }

        // 4. TESTER: 5 quyền (ngang cấp với DEV)
        for (String permName : devPerms) {
            if (map.containsKey(permName)) {
                rolePermissions.add(new RolePermission(Role.TESTER, map.get(permName)));
            }
        }

        // 5. MEMBER: 3 quyền (chỉ xem / Read-only)
        List<String> memberPerms = List.of(
                "WORKSPACE_VIEW",
                "AREA_VIEW",
                "CARD_VIEW"
        );
        for (String permName : memberPerms) {
            if (map.containsKey(permName)) {
                rolePermissions.add(new RolePermission(Role.MEMBER, map.get(permName)));
            }
        }

        rolePermissionRepository.saveAll(rolePermissions);
    }
}

