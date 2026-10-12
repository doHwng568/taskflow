package com.example.taskflow.common.dto;

import com.example.taskflow.common.enums.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Builder
// class này giúp wrapper data để xử lý theo format trước khi trả nó ra cho client
public class ApiResponse<T> {

    // business code
    private String code;
    private String message;
    private T data;
    private Instant timestamp;

    // success response
    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .code("6868")
                .message(message)
                .data(data)
                .timestamp(Instant.now())
                .build();
    }

    // error response
    public static ApiResponse<Void> error(ErrorCode errorCode) {
        return ApiResponse.<Void>builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .data(null)
                .timestamp(Instant.now())
                .build();
    }

    public static <T> ApiResponse<T> errorWithData(ErrorCode errorCode, T data) {
        return ApiResponse.<T>builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .data(data)
                .timestamp(Instant.now())
                .build();
    }
}
