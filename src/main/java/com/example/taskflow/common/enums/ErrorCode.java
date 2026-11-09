package com.example.taskflow.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@AllArgsConstructor
@Getter
public enum ErrorCode {

    USER_NOT_FOUND("USER_001", "User not found", HttpStatus.NOT_FOUND),
    USERNAME_ALREADY_EXISTS("USER_002", "Username already exists", HttpStatus.CONFLICT),
    EMAIL_ALREADY_EXISTS("USER_004", "Email already in use", HttpStatus.CONFLICT),
    CANNOT_CHANGE_OWN_ROLE("USER_003", "PM cannot change their own role", HttpStatus.BAD_REQUEST),
    INVALID_CREDENTIALS("AUTH_001", "Invalid credentials", HttpStatus.UNAUTHORIZED),
    OLD_PASSWORD_INCORRECT("AUTH_003", "Old password does not match", HttpStatus.BAD_REQUEST),
    ACCESS_DENIED("AUTH_002", "Access denied", HttpStatus.FORBIDDEN),
    VALIDATION_ERROR("COMMON_001", "Validation failed", HttpStatus.BAD_REQUEST),

    // Workspace
    WORKSPACE_NOT_FOUND("WS_001", "Workspace not found", HttpStatus.NOT_FOUND),
    WORKSPACE_HAS_AREAS(
            "WS_002",
            "Cannot delete workspace because it contains areas",
            HttpStatus.CONFLICT
    ),WORKSPACE_MEMBER_NOT_FOUND(
            "WS_003",
            "Workspace member not found",
            HttpStatus.NOT_FOUND
    ),

    WORKSPACE_MEMBER_ALREADY_EXISTS(
            "WS_004",
            "User is already a member of this workspace",
            HttpStatus.CONFLICT
    ),

    WORKSPACE_OWNER_CANNOT_BE_REMOVED(
            "WS_005",
            "Workspace owner cannot be removed",
            HttpStatus.BAD_REQUEST
    ),

    INVALID_WORKSPACE_ROLE(
            "WS_006",
            "Invalid workspace role",
            HttpStatus.BAD_REQUEST
    ),

    INVALID_OWNERSHIP_TRANSFER(
            "WS_007",
            "Invalid ownership transfer",
            HttpStatus.BAD_REQUEST
    ),
    // Area
    AREA_NOT_FOUND("AREA_001", "Area not found", HttpStatus.NOT_FOUND),
    AREA_INVALID_POSITION("AREA_002", "Invalid area position", HttpStatus.BAD_REQUEST),
    AREA_SAME_WORKSPACE("AREA_003", "Area is already in the target workspace", HttpStatus.BAD_REQUEST),
    AREA_NO_WORKSPACE("AREA_004", "Area does not belong to any workspace", HttpStatus.BAD_REQUEST),

    // Card
    CARD_NOT_FOUND("CARD_001", "Card not found", HttpStatus.NOT_FOUND),

    // Card Movement
    NOT_WORKSPACE_MEMBER("CARD_002", "User is not a member of this workspace", HttpStatus.FORBIDDEN),
    CARD_ALREADY_IN_TARGET_AREA("CARD_003", "Card is already in the target area", HttpStatus.BAD_REQUEST);

    private final String code;
    private final String message;
    private final HttpStatus httpStatus;
}