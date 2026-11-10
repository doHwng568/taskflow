package com.example.taskflow.security;

import com.example.taskflow.common.enums.Role;
import com.example.taskflow.entity.RolePermission;
import com.example.taskflow.entity.User;
import com.example.taskflow.modules.permission.repository.RolePermissionRepository;
import com.example.taskflow.user.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final RolePermissionRepository rolePermissionRepository;

    public CustomUserDetailsService(
            UserRepository userRepository,
            RolePermissionRepository rolePermissionRepository) {
        this.userRepository = userRepository;
        this.rolePermissionRepository = rolePermissionRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        Role role = user.getRole();
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();

        if (role != null) {
            // get role
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role.name()));

            // get permission
            List<RolePermission> rolePermissions = rolePermissionRepository.findByRole(role);
            for (RolePermission rp : rolePermissions) {
                authorities.add(new SimpleGrantedAuthority(rp.getPermission().getName()));
            }
        }

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                authorities);
    }
}
