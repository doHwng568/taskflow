package com.example.taskflow.common.dto;

import com.example.taskflow.common.enums.ErrorCode;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
// class này giúp wrapper data để xử lý theo format trước khi trả nó ra cho client
public class ApiResponse<T> {

    // business code
    private String code;
    private String message;
    private T data;
    private List<FieldErrorDetail> errors;
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
                .timestamp(Instant.now())
                .build();
    }

    public static <T> ApiResponse<T> errorWithData(ErrorCode errorCode, List<FieldErrorDetail> errors) {
        return ApiResponse.<T>builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .errors(errors)
                .timestamp(Instant.now())
                .build();
    }
}
