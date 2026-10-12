package com.example.taskflow.common.exception;


import com.example.taskflow.common.dto.ApiResponse;
import com.example.taskflow.common.dto.FieldErrorDetail;
import com.example.taskflow.common.enums.ErrorCode;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.List;

// Mọi exception xảy ra trong quá trình xử lý nằm dưới sự kiểm soát của
// DispatcherServlet sẽ được class này bắt lại rồi xử lý trước khi response cho client
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException ex) {
        return ResponseEntity.status(ex.getErrorCode().getHttpStatus())
                .body(ApiResponse.error(ex.getErrorCode()));
    }

    // Lỗi validate @Valid
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<List<FieldErrorDetail>>> handleValidation(
            MethodArgumentNotValidException ex) {

        List<FieldErrorDetail> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> new FieldErrorDetail(fe.getField(), fe.getDefaultMessage()))
                .toList();

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.errorWithData(ErrorCode.VALIDATION_ERROR, errors));
    }
}
