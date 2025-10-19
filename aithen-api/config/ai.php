<?php

return [
    /*
    |--------------------------------------------------------------------------
    | AI Service Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for the AI service integration
    |
    */

    'service_url' => env('AI_SERVICE_URL', 'http://localhost:8000'),
    
    'timeout' => env('AI_SERVICE_TIMEOUT', 60),
    
    'default_personality' => env('AI_DEFAULT_PERSONALITY', 'aithen_core'),
    
    'max_tokens' => env('AI_MAX_TOKENS', 512),
    
    'retry_attempts' => env('AI_RETRY_ATTEMPTS', 3),
    
    'retry_delay' => env('AI_RETRY_DELAY', 1000), // milliseconds
];
