package com.example.taskflow.auth.service;

import com.example.taskflow.auth.dto.request.RegisterRequest;
import com.example.taskflow.auth.dto.response.RegisterResponse;

public interface AuthServiceImpl {

    RegisterResponse register(RegisterRequest request);
}
