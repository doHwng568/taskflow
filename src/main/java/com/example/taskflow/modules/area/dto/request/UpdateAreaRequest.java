package com.example.taskflow.modules.area.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Body của PATCH /areas/{areaId}. Hiện chỉ đổi tên; các tính năng sau
// (màu, ghim, thu gọn...) sẽ thêm field vào đây.
public record UpdateAreaRequest(
        @NotBlank(message = "name can not be blank")
        @Size(max = 100, message = "name must be at most 100 characters")
        String name) {
}