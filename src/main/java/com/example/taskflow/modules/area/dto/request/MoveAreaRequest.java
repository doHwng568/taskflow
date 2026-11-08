package com.example.taskflow.modules.area.dto.request;

// Body của PATCH /areas/{areaId}/position
// Frontend gửi id của area đứng NGAY TRƯỚC và NGAY SAU vị trí mới (null nếu ở đầu/cuối).
// Server tự tính position mới, frontend không phải biết giá trị position.
public record MoveAreaRequest(
        Long previousAreaId,
        Long nextAreaId) {
}