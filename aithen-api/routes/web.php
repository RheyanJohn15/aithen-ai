<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AiService;

Route::get('/', function () {
    return view('welcome');
});

// Test route for AI service
Route::get('/test-ai', [AiService::class, 'health']);
