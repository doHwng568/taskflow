package com.example.taskflow.modules.area.dto.request;

import jakarta.validation.constraints.Pattern;

// Body của PATCH /areas/{areaId}/color
// color = null (hoặc không gửi) nghĩa là bỏ màu, quay về màu mặc định.
public record UpdateAreaColorRequest(
        @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "color must be a hex color like #1E40AF")
        String color) {
}