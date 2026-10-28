package com.example.taskflow.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@AllArgsConstructor
@Getter
public enum ErrorCode {

    USER_NOT_FOUND("USER_001", "User not found", HttpStatus.NOT_FOUND),
    USERNAME_ALREADY_EXISTS("USER_002", "Username already exists", HttpStatus.CONFLICT),
    INVALID_CREDENTIALS("AUTH_001", "Invalid credentials", HttpStatus.UNAUTHORIZED),
    ACCESS_DENIED("AUTH_002", "Access denied", HttpStatus.FORBIDDEN),
    VALIDATION_ERROR("COMMON_001", "Validation failed", HttpStatus.BAD_REQUEST),

    // Workspace
    WORKSPACE_NOT_FOUND("WS_001", "Workspace not found", HttpStatus.NOT_FOUND),

    // Area
    AREA_NOT_FOUND("AREA_001", "Area not found", HttpStatus.NOT_FOUND),

    // Card
    CARD_NOT_FOUND("CARD_001", "Card not found", HttpStatus.NOT_FOUND),

    // Card Movement
    NOT_WORKSPACE_MEMBER("CARD_002", "User is not a member of this workspace", HttpStatus.FORBIDDEN),
    CARD_ALREADY_IN_TARGET_AREA("CARD_003", "Card is already in the target area", HttpStatus.BAD_REQUEST);

    private final String code;
    private final String message;
    private final HttpStatus httpStatus;
}
