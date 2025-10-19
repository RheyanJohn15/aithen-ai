<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AiService;



// AI Service Routes
Route::prefix('ai')->group(function () {
    // Chat endpoints
    Route::post('/chat/stream', [AiService::class, 'streamChat']);
    Route::post('/chat/sse', [AiService::class, 'streamChatSSE']); // SSE endpoint
    Route::post('/chat', [AiService::class, 'chat']);
    
    // Personality management
    Route::get('/personalities', [AiService::class, 'personalities']);
    Route::get('/personalities/{id}', [AiService::class, 'getPersonality']);
    
    // Health check
    Route::get('/health', [AiService::class, 'health']);
});

// CORS middleware for API routes
Route::middleware(['cors'])->group(function () {
    Route::prefix('ai')->group(function () {
        Route::options('/chat/stream', function () {
            return response('', 200)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'POST, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        });
        Route::options('/chat/sse', function () {
            return response('', 200)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'POST, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        });
    });
});
